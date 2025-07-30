import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Camera, Calendar, X, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getProgressPhotos, 
  createProgressPhoto, 
  deleteProgressPhoto, 
  ProgressPhoto 
} from '@/services/database';
import { supabase } from '@/integrations/supabase/client';

const photoTypes = [
  { value: 'front', label: 'Front View', description: 'Front-facing photo' },
  { value: 'side', label: 'Side View', description: 'Profile/side photo' },
  { value: 'back', label: 'Back View', description: 'Back-facing photo' },
  { value: 'other', label: 'Other', description: 'Other angle or pose' }
];

export default function ProgressPhotoManager() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [newPhoto, setNewPhoto] = useState({
    date: new Date().toISOString().split('T')[0],
    photo_type: 'front' as ProgressPhoto['photo_type'],
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadPhotos();
    }
  }, [user]);

  const loadPhotos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getProgressPhotos(user.id);
      setPhotos(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load progress photos",
        variant: "destructive"
      });
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 10MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !user) throw new Error('No image file or user');

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!user || !imageFile) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      // Upload image
      const imageUrl = await uploadImage();

      // Create progress photo record
      await createProgressPhoto({
        user_id: user.id,
        date: newPhoto.date,
        photo_type: newPhoto.photo_type,
        image_url: imageUrl,
        notes: newPhoto.notes || null
      });

      toast({
        title: "Success",
        description: "Progress photo saved successfully!"
      });

      // Reset form
      setNewPhoto({
        date: new Date().toISOString().split('T')[0],
        photo_type: 'front',
        notes: ''
      });
      setImageFile(null);
      setImagePreview(null);
      setIsAddingPhoto(false);
      loadPhotos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save progress photo",
        variant: "destructive"
      });
      console.error('Error saving photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: ProgressPhoto) => {
    if (!confirm('Are you sure you want to delete this progress photo?')) {
      return;
    }

    try {
      // Delete from database
      await deleteProgressPhoto(photo.id);

      // Delete from storage
      const urlParts = photo.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;
      
      await supabase.storage
        .from('progress-photos')
        .remove([filePath]);

      toast({
        title: "Success",
        description: "Progress photo deleted successfully"
      });

      loadPhotos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete progress photo",
        variant: "destructive"
      });
      console.error('Error deleting photo:', error);
    }
  };

  const groupedPhotos = photos.reduce((acc, photo) => {
    const date = photo.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(photo);
    return acc;
  }, {} as Record<string, ProgressPhoto[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Progress Photos</h2>
        <Dialog open={isAddingPhoto} onOpenChange={setIsAddingPhoto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Progress Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Progress Photo</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="photo-date">Date</Label>
                  <Input
                    id="photo-date"
                    type="date"
                    value={newPhoto.date}
                    onChange={(e) => setNewPhoto(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="photo-type">Photo Type</Label>
                  <Select 
                    value={newPhoto.photo_type} 
                    onValueChange={(value: ProgressPhoto['photo_type']) => 
                      setNewPhoto(prev => ({ ...prev, photo_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {photoTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Photo</Label>
                <div className="mt-1">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-muted/50">
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={imagePreview} 
                            alt="Progress photo preview" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={(e) => {
                              e.preventDefault();
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> progress photo
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                      <input 
                        id="photo-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="photo-notes">Notes (Optional)</Label>
                <Textarea
                  id="photo-notes"
                  value={newPhoto.notes}
                  onChange={(e) => setNewPhoto(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any notes about this photo..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setIsAddingPhoto(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={uploading || !imageFile}>
                  <Camera className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Save Photo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Photo Gallery */}
      {Object.keys(groupedPhotos).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedPhotos)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, datePhotos]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date(date).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {datePhotos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                          <img
                            src={photo.image_url}
                            alt={`${photo.photo_type} view`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setSelectedPhoto(photo)}
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary">
                              {photoTypes.find(t => t.value === photo.photo_type)?.label}
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(photo);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {photo.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {photo.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No progress photos yet</h3>
            <p className="text-muted-foreground mb-4">
              Start documenting your fitness journey with progress photos.
            </p>
            <Button onClick={() => setIsAddingPhoto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Photo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {photoTypes.find(t => t.value === selectedPhoto.photo_type)?.label} - {' '}
                {new Date(selectedPhoto.date).toLocaleDateString()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.image_url}
                  alt={`${selectedPhoto.photo_type} view`}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
              {selectedPhoto.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPhoto.notes}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}