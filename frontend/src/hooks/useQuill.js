import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';

export const useQuill = (options) => {
  const [quill, setQuill] = useState(null);
  const quillRef = useRef(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (quillRef.current && !quillRef.current.__quillInitialized) {
      const q = new Quill(quillRef.current, {
        theme: 'snow',
        ...optionsRef.current
      });
      quillRef.current.__quillInitialized = true;
      setQuill(q);
    }
  }, []);

  return { quill, quillRef };
};
