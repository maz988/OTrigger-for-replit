import Quill from 'quill';

const Parchment = Quill.import('parchment');
const BlockEmbed = Quill.import('blots/block/embed');

class ButtonBlot extends BlockEmbed {
  static create(value: any) {
    const node = super.create();
    node.setAttribute('href', value.url || 'https://example.com');
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    node.classList.add('quill-button');
    
    // Add button styling classes
    node.classList.add('inline-block', 'px-4', 'py-2', 'rounded-md', 'font-medium', 'text-white');
    
    // Add color based on type
    if (value.style === 'primary') {
      node.classList.add('bg-[#f24b7c]', 'hover:bg-[#d22e5d]');
    } else if (value.style === 'secondary') {
      node.classList.add('bg-gray-600', 'hover:bg-gray-700');
    } else if (value.style === 'success') {
      node.classList.add('bg-green-600', 'hover:bg-green-700');
    }
    
    node.innerHTML = value.text || 'Button';
    return node;
  }

  static value(node: HTMLElement) {
    return {
      url: node.getAttribute('href'),
      text: node.innerHTML,
      style: node.classList.contains('bg-[#f24b7c]') ? 'primary' : 
            node.classList.contains('bg-gray-600') ? 'secondary' : 'success'
    };
  }
}

ButtonBlot.blotName = 'button';
ButtonBlot.tagName = 'a';
ButtonBlot.className = 'quill-button';

// Register the new blot
Quill.register(ButtonBlot);

export default ButtonBlot;