'use client';

import { Stack, Box, TextField, Button } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi, I'm Baymax, how can I assist you today?`,
    }
  ]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state

  const sendMessage = async () => {
    if (!message.trim()) return; // Validate input

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    setMessage('');
    setLoading(true); // Set loading state

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = '';

      const processText = async ({ done, value }) => {
        if (done) return result;

        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        result += text;

        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ];
        });

        return reader.read().then(processText);
      };

      await reader.read().then(processText);
    } catch (error) {
      console.error('Error:', error);
      // Handle error (e.g., show error message)
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant' ? 'primary.main' : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading} // Disable input while loading
          />
          <Button 
            variant="contained" 
            onClick={sendMessage} 
            disabled={loading} // Disable button while loading
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
