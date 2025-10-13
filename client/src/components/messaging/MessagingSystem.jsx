import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  Phone,
  Mail,
  Paperclip,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Circle
} from 'lucide-react';
import { toast } from 'sonner';

const MessagingSystem = ({ 
  currentUser, 
  conversations = [], 
  onSendMessage, 
  onMarkAsRead,
  onNewConversation 
}) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, important
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationData, setNewConversationData] = useState({
    clientId: '',
    subject: '',
    message: ''
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const message = {
        conversationId: selectedConversation.id,
        content: newMessage,
        senderId: currentUser.id,
        timestamp: new Date().toISOString(),
        type: 'text'
      };

      await onSendMessage(message);
      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleNewConversation = async () => {
    if (!newConversationData.clientId || !newConversationData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await onNewConversation(newConversationData);
      setNewConversationData({ clientId: '', subject: '', message: '' });
      setShowNewConversation(false);
      toast.success('Conversation started');
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const handleMarkAsRead = async (conversationId) => {
    try {
      await onMarkAsRead(conversationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unread' && conv.unreadCount > 0) ||
      (filter === 'important' && conv.priority === 'high');

    return matchesSearch && matchesFilter;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMessageStatus = (message) => {
    if (message.senderId === currentUser.id) {
      return message.read ? 'read' : 'sent';
    }
    return 'received';
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r bg-gray-50">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Messages</h3>
            <Button 
              size="sm" 
              onClick={() => setShowNewConversation(true)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1">
            {['all', 'unread', 'important'].map(filterType => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="capitalize"
              >
                {filterType}
              </Button>
            ))}
          </div>
        </div>

        {/* Conversations */}
        <div className="overflow-y-auto h-full">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations found
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  if (conversation.unreadCount > 0) {
                    handleMarkAsRead(conversation.id);
                  }
                }}
                className={`p-4 border-b cursor-pointer hover:bg-white transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-white border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {conversation.client?.name || 'Unknown Client'}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {conversation.subject || 'No subject'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <div className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessage?.timestamp || conversation.createdAt)}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {selectedConversation.client?.name || 'Unknown Client'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedConversation.subject || 'No subject'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedConversation.client?.phone && (
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  {selectedConversation.client?.email && (
                    <Button variant="ghost" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages?.map((message, index) => {
                const isOwn = message.senderId === currentUser.id;
                const status = getMessageStatus(message);
                
                return (
                  <div
                    key={index}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      <div className="text-sm">{message.content}</div>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {isOwn && (
                          status === 'read' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>New Conversation</CardTitle>
              <CardDescription>
                Start a new conversation with a client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Client</label>
                <Input
                  value={newConversationData.clientId}
                  onChange={(e) => setNewConversationData(prev => ({ 
                    ...prev, 
                    clientId: e.target.value 
                  }))}
                  placeholder="Select or enter client"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={newConversationData.subject}
                  onChange={(e) => setNewConversationData(prev => ({ 
                    ...prev, 
                    subject: e.target.value 
                  }))}
                  placeholder="Enter subject"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={newConversationData.message}
                  onChange={(e) => setNewConversationData(prev => ({ 
                    ...prev, 
                    message: e.target.value 
                  }))}
                  placeholder="Type your message..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewConversation(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleNewConversation}
                  className="flex-1"
                >
                  Start Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MessagingSystem;
