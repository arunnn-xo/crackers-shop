import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Palette,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';

const ToolbarButton = ({ active = false, disabled = false, onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
      active
        ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-[#0f0f15] dark:text-slate-300 dark:hover:bg-white/10'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
  >
    {children}
  </button>
);

const ColorControl = ({ title, icon: Icon, value, onChange, disabled = false }) => (
  <label
    title={title}
    className={`relative inline-flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-[#0f0f15] dark:text-slate-300 dark:hover:bg-white/10 ${
      disabled ? 'cursor-not-allowed opacity-50' : ''
    }`}
  >
    <input
      type="color"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="absolute inset-0 cursor-pointer opacity-0"
    />
    <Icon className="h-4 w-4" />
    <span className="absolute bottom-1 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full border border-white/40" style={{ backgroundColor: value }} />
  </label>
);

const stripHtml = (value = '') =>
  value
    .replace(/<img\b[^>]*>/gi, ' image ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isEditorValueEmpty = (value = '') => {
  if (!value) {
    return true;
  }

  return stripHtml(value).length === 0;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });

export const RichTextEditor = ({
  label,
  name,
  value,
  onChange,
  placeholder = 'Write here...',
  disabled = false,
  minHeightClass = 'min-h-[260px]',
}) => {
  const imageInputRef = useRef(null);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(value || '');
  const [textColor, setTextColor] = useState('#111827');
  const [highlightColor, setHighlightColor] = useState('#fef08a');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-sky-600 underline underline-offset-2 dark:text-sky-300',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'my-3 max-h-80 rounded-xl',
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `rich-text-content ${minHeightClass} px-4 py-3 focus:outline-none text-slate-900 dark:text-white`,
      },
    },
    onUpdate({ editor: currentEditor }) {
      const nextHtml = currentEditor.getHTML();
      setSourceValue(nextHtml);
      onChange?.({
        target: {
          name,
          value: nextHtml,
        },
      });
    },
    onSelectionUpdate({ editor: currentEditor }) {
      const activeColor = currentEditor.getAttributes('textStyle').color;
      const activeHighlight = currentEditor.getAttributes('highlight').color;
      if (activeColor) {
        setTextColor(activeColor);
      }
      if (activeHighlight) {
        setHighlightColor(activeHighlight);
      }
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled && !isSourceMode);
  }, [disabled, editor, isSourceMode]);

  useEffect(() => {
    setSourceValue(value || '');
  }, [value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    const nextValue = value || '';

    if (currentHtml === nextValue) {
      return;
    }

    if (isEditorValueEmpty(currentHtml) && isEditorValueEmpty(nextValue)) {
      return;
    }

    if (!editor.isFocused) {
      editor.commands.setContent(nextValue, false);
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor || isSourceMode) {
      return;
    }

    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter link URL', previousUrl);

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const addImage = () => {
    if (!editor || disabled || isReadingImage || isSourceMode) {
      return;
    }

    imageInputRef.current?.click();
  };

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !editor) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      window.alert('Please choose a valid image file.');
      return;
    }

    try {
      setIsReadingImage(true);
      const dataUrl = await readFileAsDataUrl(file);

      if (!dataUrl) {
        throw new Error('Unable to prepare image.');
      }

      editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
    } catch (error) {
      window.alert(error.message || 'Unable to insert image.');
    } finally {
      setIsReadingImage(false);
    }
  };

  const handleSourceChange = (event) => {
    const nextValue = event.target.value;
    setSourceValue(nextValue);
    onChange?.({
      target: {
        name,
        value: nextValue,
      },
    });
  };

  const toggleSourceMode = () => {
    if (!editor) {
      return;
    }

    if (!isSourceMode) {
      setSourceValue(editor.getHTML());
      setIsSourceMode(true);
      return;
    }

    editor.commands.setContent(sourceValue || '', false);
    setIsSourceMode(false);
  };

  const isToolbarDisabled = disabled || !editor || isSourceMode;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label> : null}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelection}
        disabled={disabled || isReadingImage}
      />
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition-colors focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-white/10 dark:bg-[#0a0a0f]">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
          <ToolbarButton
            title="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive('bold')}
            disabled={isToolbarDisabled}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive('italic')}
            disabled={isToolbarDisabled}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            active={editor?.isActive('underline')}
            disabled={isToolbarDisabled}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ColorControl
            title="Text Color"
            icon={Palette}
            value={textColor}
            onChange={(event) => {
              const nextColor = event.target.value;
              setTextColor(nextColor);
              editor?.chain().focus().setColor(nextColor).run();
            }}
            disabled={isToolbarDisabled}
          />
          <ColorControl
            title="Highlight"
            icon={Highlighter}
            value={highlightColor}
            onChange={(event) => {
              const nextColor = event.target.value;
              setHighlightColor(nextColor);
              editor?.chain().focus().setHighlight({ color: nextColor }).run();
            }}
            disabled={isToolbarDisabled}
          />
          <ToolbarButton
            title="Bullet List"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList')}
            disabled={isToolbarDisabled}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Ordered List"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList')}
            disabled={isToolbarDisabled}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align Left"
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            active={editor?.isActive({ textAlign: 'left' })}
            disabled={isToolbarDisabled}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align Center"
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            active={editor?.isActive({ textAlign: 'center' })}
            disabled={isToolbarDisabled}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align Right"
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            active={editor?.isActive({ textAlign: 'right' })}
            disabled={isToolbarDisabled}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Add Link"
            onClick={setLink}
            active={editor?.isActive('link')}
            disabled={isToolbarDisabled}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title={isReadingImage ? 'Uploading image...' : 'Insert Image'}
            onClick={addImage}
            disabled={isToolbarDisabled || isReadingImage}
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Toggle HTML"
            onClick={toggleSourceMode}
            active={isSourceMode}
            disabled={!editor || disabled}
          >
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Undo"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={isToolbarDisabled || !editor?.can().chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={isToolbarDisabled || !editor?.can().chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="relative">
          {isSourceMode ? (
            <textarea
              value={sourceValue}
              onChange={handleSourceChange}
              disabled={disabled}
              className={`w-full resize-y border-0 bg-transparent px-4 py-3 font-mono text-sm text-slate-900 focus:outline-none dark:text-white ${minHeightClass}`}
              placeholder={placeholder}
            />
          ) : (
            <>
              {isEditorValueEmpty(value) && placeholder ? (
                <div className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400 dark:text-slate-500">
                  {placeholder}
                </div>
              ) : null}
              <EditorContent editor={editor} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
