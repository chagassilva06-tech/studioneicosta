import {
  Palette,
  Mountain,
  User,
  Sparkles,
  PawPrint,
  BookOpen,
  Brush,
  Camera,
  Feather,
  Flame,
  Flower,
  Ghost,
  Heart,
  Image as ImageIcon,
  Leaf,
  Moon,
  Music,
  Star,
  Sun,
  Trees,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

export const iconMap = {
  Palette,
  Mountain,
  User,
  Sparkles,
  PawPrint,
  BookOpen,
  Brush,
  Camera,
  Feather,
  Flame,
  Flower,
  Ghost,
  Heart,
  Image: ImageIcon,
  Leaf,
  Moon,
  Music,
  Star,
  Sun,
  Trees,
  Waves,
  Wind,
  Zap,
} as const;

export type IconName = keyof typeof iconMap;

export const iconNames = Object.keys(iconMap) as IconName[];

export function getIcon(name: string | null | undefined) {
  if (name && name in iconMap) return iconMap[name as IconName];
  return Palette;
}
