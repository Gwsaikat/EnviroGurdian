"use client"

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, MessageSquare, Sparkles, AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";


interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  status?: "sending" | "sent" | "error";
}

export function AIChat() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Add a small delay to ensure the DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
    // Pulse animation when new messages arrive
    if (messages.length > 0) {
      controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 0.5 }
      });
    }
  }, [messages, controls]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (messageToSend = input, retry = false) => {
    // Ensure messageToSend is a string before calling trim
    const messageText = typeof messageToSend === 'string' ? messageToSend.trim() : '';
    if (!messageText) return;
    
    // If this is a retry, remove the error message
    if (retry) {
      setMessages(prev => prev.filter(msg => 
        !(msg.role === "assistant" && msg.status === "error")
      ));
      setRetryMessage(null);
    } else {
      setRetryMessage(messageText);
    }

    const userMsg: Message = { 
      role: "user", 
      content: messageText,
      timestamp: new Date(),
      status: "sent"
    };
    
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    
    // Add a temporary loading message
    const tempId = Date.now().toString();
    setMessages(msgs => [
      ...msgs,
      { 
        role: "assistant", 
        content: "...", 
        status: "sending",
        timestamp: new Date()
      }
    ]);

    try {
      console.log("Sending message to API:", messageText);
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: messageText }),
      });
      
      const data = await res.json();
      console.log("API response:", data);
      
      // Remove the temporary loading message
      setMessages(msgs => msgs.filter(msg => msg.status !== "sending"));
      
      if (data.error) {
        const errorMsg = `Error: ${data.error}${data.details ? ` - ${data.details}` : ''}`;
        setError(errorMsg);
        setMessages(msgs => [
          ...msgs,
          { 
            role: "assistant", 
            content: `I'm sorry, I couldn't process your request. ${data.error}`, 
            status: "error",
            timestamp: new Date()
          }
        ]);
      } else {
        setMessages(msgs => [
          ...msgs,
          { 
            role: "assistant", 
            content: data.answer || "Sorry, I couldn't answer that.",
            status: "sent",
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      
      // Remove the temporary loading message
      setMessages(msgs => msgs.filter(msg => msg.status !== "sending"));
      
      const errorMsg = `Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`;
      setError(errorMsg);
      setMessages(msgs => [
        ...msgs,
        { 
          role: "assistant", 
          content: "I'm having trouble connecting to the AI service. Please try again later.", 
          status: "error",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRetry = () => {
    if (retryMessage) {
      sendMessage(retryMessage, true);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    }).format(date);
  };

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
        ease: "easeOut"
      }
    }
  };

  const messageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 0 0 rgba(var(--primary), 0.4)",
        "0 0 20px rgba(var(--primary), 0.6)",
        "0 0 0 rgba(var(--primary), 0.4)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const typingVariants = {
    initial: { width: 0 },
    animate: { 
      width: "auto",
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className="w-full h-full rounded-2xl glass-morphism shadow-xl p-5 flex flex-col gap-3 border border-border/50 glow-effect overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-full shadow-glow-sm">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium neon-text">EnviroGuardian AI</h3>
          </div>
        </div>
        
        <motion.div 
          className="flex-1 overflow-y-auto max-h-[350px] space-y-4 mb-3 p-2 custom-scrollbar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {messages.length === 0 && (
            <motion.div 
              className="text-center py-10 glass-morphism rounded-2xl p-6 border border-border/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="relative w-16 h-16 mx-auto mb-4">
                <motion.div 
                  className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                />
                <Bot className="w-16 h-16 mx-auto text-primary relative z-10" />
              </div>
              <h4 className="font-medium mb-2 text-lg">How can I help you today?</h4>
              <p className="text-muted-foreground text-sm">Ask about air quality, pollution levels, health recommendations, or environmental data.</p>
              
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {["What's the air quality like today?", "Health tips for high pollution", "What causes PM2.5 pollution?"].map((suggestion, i) => (
                  <motion.button
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all duration-300"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
              >
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`rounded-full p-2 shadow-glow-sm ${msg.role === "user" ? "bg-primary" : "bg-secondary"}`}>
                    {msg.role === "user" ? 
                      <User className="w-4 h-4 text-primary-foreground" /> : 
                      <Bot className="w-4 h-4 text-secondary-foreground" />
                    }
                  </div>
                  <motion.div 
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-glow-sm ${msg.role === "user" 
                      ? "bg-primary/90 text-primary-foreground rounded-tr-none glass-morphism" 
                      : "bg-secondary/90 text-secondary-foreground rounded-tl-none glass-morphism"}`}
                    whileHover={{ scale: 1.01 }}
                  >
                    {msg.content}
                  </motion.div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                className="flex justify-start"
                variants={messageVariants}
                initial="initial"
                animate="animate"
              >
                <div className="flex items-center gap-2 max-w-[85%]">
                  <div className="rounded-full p-2 bg-secondary shadow-glow-sm">
                    <Bot className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  <div className="rounded-2xl px-6 py-3 text-sm shadow-glow-sm bg-secondary/90 text-secondary-foreground rounded-tl-none glass-morphism">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </motion.div>
        
        {error && (
          <motion.div 
            className="text-xs text-red-500 mb-2 px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
        
        <div className="flex items-center gap-2">
          <motion.div 
            className="relative flex-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about air quality..."
              className="w-full bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 shadow-glow-sm text-foreground"
              disabled={loading}
            />
            {input.length > 0 && (
              <motion.button
                className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full"
                onClick={() => setInput('')}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="sr-only">Clear input</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </motion.button>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="icon" 
              className="rounded-xl shadow-glow h-10 w-10 bg-primary/90 hover:bg-primary transition-all duration-300" 
              onClick={() => sendMessage(input, false)}
              disabled={loading || !input.trim()}
            >
              {loading ? 
                <Loader2 className="w-4 h-4 animate-spin" /> : 
                <Send className="w-4 h-4" />
              }
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}