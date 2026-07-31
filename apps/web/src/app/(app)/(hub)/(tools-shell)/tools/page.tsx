import { redirect } from 'next/navigation';

export default function ToolsIndexPage() {
  redirect('/notifications/settings');
}
