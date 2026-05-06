import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCw, FlipHorizontal, X } from 'lucide-react';

export default function PhotoEditor({ isOpen, onClose, photo, onSave }) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  if (!isOpen || !photo?.url) return null;

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleFlip = () => setFlipH(prev => !prev);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    onSave({
      ...photo,
      transforms: { rotation, flipH, offsetX, offsetY }
    });
    onClose();
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setOffsetX(0);
    setOffsetY(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview */}
          <div
            className="w-full h-96 bg-muted rounded-lg overflow-hidden border-2 border-dashed cursor-move relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={photo.url}
              alt={photo.name}
              ref={canvasRef}
              className="w-full h-full object-contain"
              style={{
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) translate(${offsetX}px, ${offsetY}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s',
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleRotate} className="gap-2">
              <RotateCw className="w-4 h-4" />
              Rotate
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleFlip} className="gap-2">
              <FlipHorizontal className="w-4 h-4" />
              Flip H
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <div className="flex-1" />
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="gap-1">
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              Save Edit
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">Drag the image to reposition, use buttons to rotate and flip.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}