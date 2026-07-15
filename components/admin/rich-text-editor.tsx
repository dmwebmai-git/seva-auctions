'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import { Node, mergeAttributes } from '@tiptap/core'
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  MousePointerClick,
  Undo2,
  Redo2,
  Quote,
} from 'lucide-react'
import { toast } from 'sonner'

// Custom block node that renders a styled call-to-action button (an anchor).
const CtaButton = Node.create({
  name: 'ctaButton',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      href: {
        default: '#',
        parseHTML: (el: HTMLElement) => el.getAttribute('href') || '#',
        renderHTML: (attrs: any) => ({ href: attrs.href }),
      },
      label: {
        default: 'Button',
        parseHTML: (el: HTMLElement) => el.textContent || 'Button',
        renderHTML: () => ({}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'a[data-cta-button]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-cta-button': 'true',
        class: 'seva-content-button',
        rel: 'noopener noreferrer',
      }),
      node.attrs.label,
    ]
  },
})

type ToolbarButtonProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-md border text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-[#94B957] border-[#94B957] text-white'
          : 'bg-white border-gray-200 text-[#524C4C] hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-6 bg-gray-200 mx-1" />
}

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      CtaButton,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'seva-content focus:outline-none min-h-[520px] px-4 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes (e.g. when a different page is selected) into the editor.
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter the link URL', previous || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const insertButton = useCallback(() => {
    if (!editor) return
    const label = window.prompt('Button text', 'Learn More')
    if (!label) return
    const href = window.prompt('Button link URL', 'https://')
    if (!href) return
    editor.chain().focus().insertContent({
      type: 'ctaButton',
      attrs: { href, label },
    }).run()
  }, [editor])

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!editor) return
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await fetch('/api/admin/content/upload', {
          method: 'POST',
          body: form,
        })
        if (!res.ok) throw new Error('upload failed')
        const data = await res.json()
        editor.chain().focus().setImage({ src: data.url, alt: file.name }).run()
        toast.success('Image inserted')
      } catch (err) {
        console.error('Image upload error:', err)
        toast.error('Failed to upload image')
      }
    },
    [editor]
  )

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-lg min-h-[560px] bg-white animate-pulse" />
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 sticky top-0 z-10">
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Subheading" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Add / edit link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Remove link" disabled={!editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Insert image" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Insert button" onClick={insertButton}>
          <MousePointerClick className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Editable area */}
      <EditorContent editor={editor} />
    </div>
  )
}
