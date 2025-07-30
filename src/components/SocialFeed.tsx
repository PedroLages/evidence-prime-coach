import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share, Trophy, Target, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    level: number;
  };
  type: 'workout' | 'achievement' | 'progress' | 'goal';
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  data?: any;
}

const mockPosts: SocialPost[] = [
  {
    id: '1',
    user: { name: 'Alex Johnson', avatar: '', level: 15 },
    type: 'achievement',
    content: 'Just hit a new PR! 225lbs bench press 💪',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 8,
    isLiked: false,
    data: { exercise: 'Bench Press', weight: 225, reps: 1 }
  },
  {
    id: '2',
    user: { name: 'Sarah Chen', avatar: '', level: 12 },
    type: 'workout',
    content: 'Crushed leg day today! Feeling stronger every session 🔥',
    timestamp: '4 hours ago',
    likes: 18,
    comments: 5,
    isLiked: true
  },
  {
    id: '3',
    user: { name: 'Mike Rodriguez', avatar: '', level: 8 },
    type: 'goal',
    content: 'Week 3 of my cut - down 5 lbs and feeling great!',
    timestamp: '1 day ago',
    likes: 31,
    comments: 12,
    isLiked: false
  }
];

export function SocialFeed() {
  const [posts, setPosts] = useState<SocialPost[]>(mockPosts);
  const [newPost, setNewPost] = useState('');
  const { toast } = useToast();

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleShare = (post: SocialPost) => {
    navigator.clipboard.writeText(`Check out ${post.user.name}'s achievement: ${post.content}`);
    toast({
      title: "Shared!",
      description: "Post copied to clipboard"
    });
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    
    const post: SocialPost = {
      id: Date.now().toString(),
      user: { name: 'You', avatar: '', level: 10 },
      type: 'workout',
      content: newPost,
      timestamp: 'now',
      likes: 0,
      comments: 0,
      isLiked: false
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
    toast({
      title: "Posted!",
      description: "Your post has been shared with the community"
    });
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'goal': return <Target className="h-4 w-4 text-blue-500" />;
      case 'progress': return <Zap className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Share Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's your latest achievement or workout update?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handlePost} disabled={!newPost.trim()}>
            Share Post
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{post.user.name}</span>
                    <Badge variant="secondary">Level {post.user.level}</Badge>
                    {getPostIcon(post.type)}
                    <span className="text-sm text-muted-foreground">{post.timestamp}</span>
                  </div>
                  
                  <p className="text-sm leading-relaxed">{post.content}</p>
                  
                  {post.data && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm font-medium">
                        {post.data.exercise}: {post.data.weight}lbs × {post.data.reps} reps
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={post.isLiked ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                      {post.likes}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.comments}
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={() => handleShare(post)}>
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}