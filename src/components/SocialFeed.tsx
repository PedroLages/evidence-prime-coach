import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Trophy, TrendingUp, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SocialPost {
  id: string;
  user_id: string;
  post_type: 'workout' | 'achievement' | 'progress' | 'milestone';
  content: string;
  data: any;
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export const SocialFeed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts((data || []) as SocialPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!user || !newPostContent.trim()) return;

    setIsPosting(true);
    try {
      const { error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          post_type: 'milestone',
          content: newPostContent,
          is_public: true
        });

      if (error) throw error;
      
      setNewPostContent('');
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        // Decrement likes count
        await supabase
          .from('social_posts')
          .update({ likes_count: posts.find(p => p.id === postId)?.likes_count! - 1 })
          .eq('id', postId);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });

        // Increment likes count
        await supabase
          .from('social_posts')
          .update({ likes_count: posts.find(p => p.id === postId)?.likes_count! + 1 })
          .eq('id', postId);
      }

      await fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'progress':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'workout':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <MapPin className="h-5 w-5 text-purple-500" />;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return <div>Loading social feed...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Social Feed</h2>
        <p className="text-muted-foreground">Connect with the fitness community</p>
      </div>

      {/* Create Post */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Share Your Progress</CardTitle>
            <CardDescription>Tell the community about your fitness journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What's your latest achievement? Share your progress with the community..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={createPost} 
              disabled={!newPostContent.trim() || isPosting}
              className="w-full"
            >
              {isPosting ? 'Posting...' : 'Share Post'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.profiles?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">User</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(post.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPostIcon(post.post_type)}
                    <Badge variant="outline" className="capitalize">
                      {post.post_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{post.content}</p>
                
                {/* Post Data */}
                {post.data && (
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-sm">{JSON.stringify(post.data, null, 2)}</pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likePost(post.id)}
                    className="flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    {post.likes_count}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments_count}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};