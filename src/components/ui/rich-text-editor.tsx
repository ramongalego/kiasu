'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Code,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  hasError,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder })],
    content: value,
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[160px] px-3 py-2 text-sm focus:outline-none prose-editor',
      },
    },
  });

  if (!editor) return null;

  const toolbarBtnClass = (active: boolean) =>
    cn(
      'cursor-pointer rounded p-1.5 transition-colors duration-150',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );

  return (
    <div
      className={cn(
        'mt-1 rounded-xl border bg-muted/50 transition-all duration-200 focus-within:border-border focus-within:ring-2 focus-within:ring-ring',
        hasError ? 'border-destructive' : 'border-border/50',
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 rounded-t-xl border-b border-border/40 bg-muted px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarBtnClass(editor.isActive('bold'))}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarBtnClass(editor.isActive('italic'))}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={toolbarBtnClass(editor.isActive('underline'))}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={toolbarBtnClass(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={toolbarBtnClass(editor.isActive('code'))}
          title="Inline code"
        >
          <Code className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-muted-foreground/40" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtnClass(editor.isActive('bulletList'))}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtnClass(editor.isActive('orderedList'))}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      <style>{`
        .prose-editor p { margin: 0; }
        .prose-editor p + p { margin-top: 0.375rem; }
        .prose-editor ul,
        .prose-editor ol { margin: 0.25rem 0; padding-left: 1.25rem; }
        .prose-editor ul { list-style-type: disc; }
        .prose-editor ol { list-style-type: decimal; }
        .prose-editor li { margin: 0; }
        .prose-editor code { font-family: var(--font-mono), monospace; font-size: 0.8em; background: hsl(var(--muted)); border-radius: 0.25rem; padding: 0.1em 0.3em; }
        .prose-editor .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
