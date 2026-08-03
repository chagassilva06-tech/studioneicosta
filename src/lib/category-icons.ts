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
  Palette: { icon: Palette, label: "Paleta" },
  Mountain: { icon: Mountain, label: "Montanha" },
  User: { icon: User, label: "Usuário" },
  Sparkles: { icon: Sparkles, label: "Brilhos" },
  PawPrint: { icon: PawPrint, label: "Pegada" },
  BookOpen: { icon: BookOpen, label: "Livro" },
  Brush: { icon: Brush, label: "Pincel" },
  Camera: { icon: Camera, label: "Câmera" },
  Feather: { icon: Feather, label: "Pena" },
  Flame: { icon: Flame, label: "Fogo" },
  Flower: { icon: Flower, label: "Flor" },
  Ghost: { icon: Ghost, label: "Fantasma" },
  Heart: { icon: Heart, label: "Coração" },
  Image: { icon: ImageIcon, label: "Imagem" },
  Leaf: { icon: Leaf, label: "Folha" },
  Moon: { icon: Moon, label: "Lua" },
  Music: { icon: Music, label: "Música" },
  Star: { icon: Star, label: "Estrela" },
  Sun: { icon: Sun, label: "Sol" },
  Trees: { icon: Trees, label: "Árvores" },
  Waves: { icon: Waves, label: "Ondas" },
  Wind: { icon: Wind, label: "Vento" },
  Zap: { icon: Zap, label: "Raio" },
} as const;

export type IconName = keyof typeof iconMap;

export const iconNames = Object.keys(iconMap) as IconName[];

export function getIcon(name: string | null | undefined) {
  if (name && name in iconMap) return iconMap[name as IconName].icon;
  return Palette;
}
