'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Code } from '@/components/ui/code';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ResultsData {
  results: Array<Record<string, any>>;
  columns: string[];
  row_count: number;
  error?: string;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  results?: ResultsData | null;
  status?: 'thinking' | 'generating_sql' | 'executing_sql' | 'generating_explanation' | 'complete';
}

interface StreamData {
  status?: string;
  sql?: string;
  results?: ResultsData;
  explanation_chunk?: string;
  explanation?: string;
  complete?: boolean;
  error?: string;
}

const ChatWithDB: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Create initial AI message
    const aiMessageId = Date.now().toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      sql: '',
      results: null,
      status: 'thinking',
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      // Close any existing event source
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new event source for streaming
      console.log(`Connecting to ${API_URL}/api/chat/ask/stream?question=${encodeURIComponent(input)}&db_type=bigquery`);
      const eventSource = new EventSource(
        `${API_URL}/api/chat/ask/stream?question=${encodeURIComponent(input)}&db_type=bigquery`
      );
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        console.log('Received message:', event.data);
        try {
          const data: StreamData = JSON.parse(event.data);

          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const aiMessageIndex = updatedMessages.findIndex((msg) => msg.id === aiMessageId);

            if (aiMessageIndex !== -1) {
              const updatedAiMessage = { ...updatedMessages[aiMessageIndex] };

              // Update message based on the data received
              if (data.status) {
                console.log('Status update:', data.status);
                updatedAiMessage.status = data.status as Message['status'];
              }

              if (data.sql) {
                console.log('SQL received:', data.sql);
                updatedAiMessage.sql = data.sql;
              }

              if (data.results) {
                console.log('Results received:', data.results);
                updatedAiMessage.results = data.results;
              }

              if (data.explanation_chunk) {
                console.log('Explanation chunk received');
                updatedAiMessage.content += data.explanation_chunk;
              }

              if (data.complete) {
                console.log('Response complete');
                updatedAiMessage.status = 'complete';
                updatedAiMessage.content = data.explanation || updatedAiMessage.content;
                updatedAiMessage.sql = data.sql || updatedAiMessage.sql;
                updatedAiMessage.results = data.results || updatedAiMessage.results;
                eventSource.close();
              }

              updatedMessages[aiMessageIndex] = updatedAiMessage;
            }

            return updatedMessages;
          });
        } catch (err) {
          console.error('Error parsing event data:', err, event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setError('Error connecting to the server. Please try again.');

        // Update the message to show the error
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          const aiMessageIndex = updatedMessages.findIndex((msg) => msg.id === aiMessageId);

          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex] = {
              ...updatedMessages[aiMessageIndex],
              content: 'Error connecting to the database. Please try again.',
              status: 'complete'
            };
          }

          return updatedMessages;
        });

        eventSource.close();
        setIsLoading(false);
      };

      // When the stream completes
      eventSource.addEventListener('done', () => {
        eventSource.close();
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Render SQL results as a table
  const renderResults = (results: ResultsData | null) => {
    if (!results || !results.results || !Array.isArray(results.results) || results.results.length === 0) {
      return <p>No results</p>;
    }

    const columns = results.columns || Object.keys(results.results[0]);

    return (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="border border-zinc-200 p-2 text-left dark:border-zinc-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.results.slice(0, 10).map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j} className="border border-zinc-200 p-2 dark:border-zinc-700">
                    {row[col] !== null ? String(row[col]) : 'NULL'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {results.results.length > 10 && (
          <p className="mt-2 text-sm text-zinc-500">
            Showing 10 of {results.results.length} results
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">
        Chat with Database
      </h1>

      <Card className="flex h-[600px] flex-col">
        <CardContent className="flex-1 p-4">
          <ScrollArea className="h-full px-2 py-4">
            {messages.length === 0 ? (
              <p className="text-center text-zinc-500">
                Ask a question about your database
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${message.role === 'user' ? 'ml-auto' : 'mr-auto'} max-w-[80%]`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-100 text-black dark:bg-zinc-800 dark:text-white'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p>{message.content}</p>
                    ) : (
                      <div className="space-y-3">
                        {message.status === 'thinking' || message.status === 'generating_sql' ? (
                          <div className="flex items-center space-x-2">
                            <Spinner className="h-4 w-4" />
                            <p>Generating SQL...</p>
                          </div>
                        ) : message.status === 'executing_sql' ? (
                          <div className="flex items-center space-x-2">
                            <Spinner className="h-4 w-4" />
                            <p>Executing SQL...</p>
                          </div>
                        ) : message.status === 'generating_explanation' ? (
                          <div className="flex items-center space-x-2">
                            <Spinner className="h-4 w-4" />
                            <p>Generating explanation...</p>
                          </div>
                        ) : null}

                        {message.sql && (
                          <div className="w-full">
                            <p className="mb-1 font-bold">SQL Query:</p>
                            <Code className="block w-full whitespace-pre-wrap rounded p-2">
                              {message.sql}
                            </Code>
                          </div>
                        )}

                        {message.results && (
                          <div className="w-full">
                            <p className="mb-1 font-bold">Results:</p>
                            {renderResults(message.results)}
                          </div>
                        )}

                        {message.content && (
                          <div className="w-full">
                            <Separator className="my-3" />
                            <p>{message.content}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              placeholder="Ask a question about your database..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </form>

          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatWithDB;
