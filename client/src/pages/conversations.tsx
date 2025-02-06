import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Conversation, Message } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Conversations() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  const { data: conversations, isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages, isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/conversations/${selectedConversation!.id}/messages`, {
        content: message,
        fromUser: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
      });
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate(newMessage);
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {loadingConversations ? (
                  <div className="text-center py-4">Loading conversations...</div>
                ) : conversations?.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations?.map((conv) => (
                      <Button
                        key={conv.id}
                        variant={selectedConversation?.id === conv.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="truncate text-left">
                          <div>{conv.phoneNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(conv.lastMessageAt), "PPp")}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedConversation
                  ? `Chat with ${selectedConversation.phoneNumber}`
                  : "Select a conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedConversation ? (
                <div className="flex flex-col h-[600px]">
                  <ScrollArea className="flex-1 pr-4">
                    {loadingMessages ? (
                      <div className="text-center py-4">Loading messages...</div>
                    ) : messages?.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No messages yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages?.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "max-w-[80%] rounded-lg p-4",
                              msg.fromUser
                                ? "ml-auto bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <div className="text-sm">{msg.content}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {format(new Date(msg.timestamp), "pp")}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      type="submit"
                      disabled={sendMessageMutation.isPending || !newMessage.trim()}
                    >
                      Send
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                  Select a conversation to start chatting
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
