import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Award,
  Bell,
  Bold,
  Book,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  CircleStar,
  Clock,
  Code,
  Copy,
  CornerUpLeft,
  Ellipsis,
  ExternalLink,
  EyeOff,
  FileText,
  Flag,
  Globe,
  Hash,
  Heart,
  Image,
  Info,
  Italic,
  LayoutGrid,
  Link,
  ListFilter,
  LocateFixed,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Maximize2,
  MessageSquare,
  Minimize2,
  Minus,
  Pencil,
  PenLine,
  Phone,
  Pin,
  Play,
  Plus,
  QrCode,
  Repeat2,
  RulerDimensionLine,
  Search,
  Send,
  SendHorizontal,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Smile,
  Star,
  Table,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  User,
  UserMinus,
  UserPlus,
  Users,
  Video,
  VolumeX,
  Wallet,
  Weight,
  X,
  Zap,
} from 'lucide-react';

import { ICON_SIZE, resolveIconSize } from '../../constants';
import type { IconComponent, IconComponentProps } from '../../types';

export function createLucideIcon(LucideGlyph: LucideIcon): IconComponent {
  return function LucideIconWrapper({
    size,
    className,
    strokeWidth,
    title,
  }: IconComponentProps) {
    const px = resolveIconSize(size);
    if (title) {
      return (
        <LucideGlyph
          size={px}
          className={className}
          strokeWidth={strokeWidth}
          role="img"
          aria-hidden={undefined}
        >
          <title>{title}</title>
        </LucideGlyph>
      );
    }

    return (
      <LucideGlyph
        size={px}
        className={className}
        strokeWidth={strokeWidth}
        aria-hidden
      />
    );
  };
}

export const lucideIconPack = {
  'arrow-left-right': createLucideIcon(ArrowLeftRight),
  'arrow-up-down': createLucideIcon(ArrowUpDown),
  award: createLucideIcon(Award),
  bell: createLucideIcon(Bell),
  bold: createLucideIcon(Bold),
  book: createLucideIcon(Book),
  'book-open': createLucideIcon(BookOpen),
  calendar: createLucideIcon(Calendar),
  check: createLucideIcon(Check),
  'check-circle': createLucideIcon(CircleCheck),
  'circle-star': createLucideIcon(CircleStar),
  'chevron-down': createLucideIcon(ChevronDown),
  'chevron-left': createLucideIcon(ChevronLeft),
  'chevron-right': createLucideIcon(ChevronRight),
  clock: createLucideIcon(Clock),
  close: createLucideIcon(X),
  code: createLucideIcon(Code),
  comment: createLucideIcon(MessageSquare),
  copy: createLucideIcon(Copy),
  dollar: createLucideIcon(CircleDollarSign),
  emoji: createLucideIcon(Smile),
  'external-link': createLucideIcon(ExternalLink),
  'eye-off': createLucideIcon(EyeOff),
  'file-text': createLucideIcon(FileText),
  filter: createLucideIcon(ListFilter),
  flag: createLucideIcon(Flag),
  globe: createLucideIcon(Globe),
  hash: createLucideIcon(Hash),
  heart: createLucideIcon(Heart),
  image: createLucideIcon(Image),
  info: createLucideIcon(Info),
  italic: createLucideIcon(Italic),
  'layout-grid': createLucideIcon(LayoutGrid),
  link: createLucideIcon(Link),
  locate: createLucideIcon(LocateFixed),
  lock: createLucideIcon(Lock),
  'lock-open': createLucideIcon(LockOpen),
  mail: createLucideIcon(Mail),
  'map-pin': createLucideIcon(MapPin),
  maximize: createLucideIcon(Maximize2),
  minimize: createLucideIcon(Minimize2),
  minus: createLucideIcon(Minus),
  'more-horizontal': createLucideIcon(Ellipsis),
  mute: createLucideIcon(VolumeX),
  pencil: createLucideIcon(Pencil),
  'pen-line': createLucideIcon(PenLine),
  phone: createLucideIcon(Phone),
  pin: createLucideIcon(Pin),
  play: createLucideIcon(Play),
  plus: createLucideIcon(Plus),
  'qr-code': createLucideIcon(QrCode),
  reblog: createLucideIcon(Repeat2),
  reply: createLucideIcon(CornerUpLeft),
  'ruler-dimension-line': createLucideIcon(RulerDimensionLine),
  search: createLucideIcon(Search),
  send: createLucideIcon(Send),
  'send-horizontal': createLucideIcon(SendHorizontal),
  'shopping-bag': createLucideIcon(ShoppingBag),
  'shopping-cart': createLucideIcon(ShoppingCart),
  smartphone: createLucideIcon(Smartphone),
  star: createLucideIcon(Star),
  table: createLucideIcon(Table),
  'thumb-down': createLucideIcon(ThumbsDown),
  'thumb-up': createLucideIcon(ThumbsUp),
  trash: createLucideIcon(Trash2),
  'trending-up': createLucideIcon(TrendingUp),
  user: createLucideIcon(User),
  'user-minus': createLucideIcon(UserMinus),
  'user-plus': createLucideIcon(UserPlus),
  users: createLucideIcon(Users),
  video: createLucideIcon(Video),
  wallet: createLucideIcon(Wallet),
  weight: createLucideIcon(Weight),
  zap: createLucideIcon(Zap),
} as const satisfies Record<string, IconComponent>;

export type LucideIconName = keyof typeof lucideIconPack;

/** Default pixel size re-export for callers that need explicit dimensions. */
export { ICON_SIZE };
