import React, { useState, useEffect, useRef } from "react";

// 🔹 Streaming function to call Ollama API
async function callOllama(prompt, onChunk) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma:2b",
      prompt: prompt,
      stream: true // ✅ enable streaming mode
    })
  });

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true }).trim();
    if (!chunk) continue;

    // Ollama streams chunked JSON objects line by line
    const lines = chunk.split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const jsonData = JSON.parse(line);
        if (jsonData.response) {
          fullText += jsonData.response;
          onChunk(fullText); // Update UI each time
        }
      } catch (err) {
        // ignore incomplete JSON while streaming
      }
    }
  }

  return fullText.trim();
}

const questions = [
  "Tell me about yourself.",
  "What are your greatest strengths?",
  "Why do you want to work here?",
  "Describe a challenge you faced and how you handled it.",
  "Do you have any questions for us?"
];

export default function AIInterviewBot() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chat, setChat] = useState([
    {
      sender: "bot",
      text: "👋 Hello! Welcome to your AI Interview practice session. I’ll be your interviewer today. Let’s get started!"
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, currentQuestionIndex]);

  const handleUserSubmit = async () => {
    if (!userInput.trim() || isBotTyping) return;

    // Add user reply
    setChat(prev => [...prev, { sender: "user", text: userInput }]);
    setUserInput("");
    setIsBotTyping(true);

    // Prepare prompt
    const prompt = `You are an interview coach AI.
Provide helpful and concise feedback to interview answers.
Question: ${questions[currentQuestionIndex]}
Answer: ${userInput}
Feedback:`;

    // Add empty bot message (will be updated as stream comes in)
    const botMsgIndex = chat.length + 1;
    setChat(prev => [...prev, { sender: "bot", text: "" }]);

    try {
      await callOllama(prompt, (partial) => {
        setChat(prev =>
          prev.map((msg, idx) =>
            idx === botMsgIndex ? { ...msg, text: partial } : msg
          )
        );
      });

      // Move to next question automatically
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

    } catch (error) {
      console.error("Streaming error:", error);
      setChat(prev => [
        ...prev,
        { sender: "bot", text: "❌ Error: Could not connect to local AI." }
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleRestart = () => {
    setChat([
      {
        sender: "bot",
        text: "👋 Welcome back! Let’s restart your AI interview practice."
      }
    ]);
    setCurrentQuestionIndex(0);
    setUserInput("");
  };

  return (
    <>
      {/* Title */}
      <h3 className="title-gradient">🤖 AI Interview Practice</h3>

      <div className="chat-container">
        {/* Greeting */}
        {chat
          .filter((msg, idx) => idx === 0 && msg.sender === "bot")
          .map((msg, idx) => (
            <div key={idx} className="chat-message bot greeting-message">
              <span>{msg.text}</span>
            </div>
          ))}

        {/* Current Question */}
        <div className="chat-message bot current-question">
          <span>{questions[currentQuestionIndex]}</span>
        </div>

        {/* Rest of messages */}
        {chat
          .filter((msg, idx) => !(idx === 0 && msg.sender === "bot"))
          .map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              <span>{msg.text}</span>
            </div>
          ))}

        {isBotTyping && (
          <div className="chat-message bot">
            <span>Typing...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder="Type your answer..."
        value={userInput}
        disabled={isBotTyping}
        onChange={e => setUserInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleUserSubmit()}
      />

      {/* Buttons */}
      <button onClick={handleUserSubmit} disabled={isBotTyping || !userInput.trim()}>
        Submit
      </button>
      <button onClick={handleRestart} style={{ backgroundColor: "#4a148c" }}>
        Restart Interview
      </button>
    </>
  );
}
