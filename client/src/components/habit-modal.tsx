import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InsertHabit } from "@shared/schema";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: InsertHabit) => void;
  initialData?: Partial<InsertHabit>;
}

const categories = [
  "Health",
  "Productivity", 
  "Personal",
  "Learning",
  "Social",
  "Finance"
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom Days" }
];

const units = [
  "minutes",
  "hours", 
  "pages",
  "times",
  "glasses",
  "sessions"
];

const emojiOptions = [
  "🏃‍♂️", "📖", "🧘‍♀️", "💻", "💧", "🍎", "✍️", "🎵",
  "🎯", "💪", "🌟", "⭐", "🔥", "💎", "🎨", "🍃"
];

export function HabitModal({ isOpen, onClose, onSave, initialData }: HabitModalProps) {
  const [formData, setFormData] = useState<InsertHabit>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "Health",
    frequency: initialData?.frequency || "daily",
    customDays: initialData?.customDays || [],
    target: initialData?.target || undefined,
    unit: initialData?.unit || "minutes",
    icon: initialData?.icon || "🎯",
    isActive: initialData?.isActive ?? true
  });

  const [selectedIcon, setSelectedIcon] = useState(formData.icon);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    onSave({
      ...formData,
      icon: selectedIcon,
      target: formData.target || undefined
    });
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      category: "Health",
      frequency: "daily",
      customDays: [],
      target: undefined,
      unit: "minutes",
      icon: "🎯",
      isActive: true
    });
    setSelectedIcon("🎯");
    onClose();
  };

  const handleInputChange = (field: keyof InsertHabit, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Habit Name */}
          <div>
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Morning Exercise"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          
          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Frequency */}
          <div>
            <Label>Frequency</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value) => handleInputChange("frequency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Target and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                value={formData.target || ""}
                onChange={(e) => handleInputChange("target", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="30"
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Select 
                value={formData.unit || "minutes"} 
                onValueChange={(value) => handleInputChange("unit", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Icon Selection */}
          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {emojiOptions.map(emoji => (
                <Button
                  key={emoji}
                  type="button"
                  variant={selectedIcon === emoji ? "default" : "outline"}
                  className="p-2 text-xl h-auto"
                  onClick={() => setSelectedIcon(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Create Habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
