"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface NarrativeDisplayProps {
  content: string;
  isLoading: boolean;
  title?: string;
  typingSpeed?: number;
  highlightTerms?: string[];
}

export default function NarrativeDisplay({
  content,
  isLoading,
  title,
  typingSpeed = 15,
  highlightTerms = [],
}: NarrativeDisplayProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [skipTypewriter, setSkipTypewriter] = useState(false);
  const [highlightedContent, setHighlightedContent] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Typewriter effect for narrative text
  useEffect(() => {
    if (isLoading) {
      setDisplayedContent("");
      setIsTyping(false);
      return;
    }
    
    if (content && content !== displayedContent && !skipTypewriter) {
      setIsTyping(true);
      let index = 0;
      const timer = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.substring(0, index + 1));
          index++;
          
          // Auto-scroll to keep up with the text
          if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
          }
        } else {
          clearInterval(timer);
          setIsTyping(false);
          highlightImportantTerms(content);
        }
      }, typingSpeed); // Speed of typing
      
      return () => clearInterval(timer);
    } else if (skipTypewriter && content) {
      setDisplayedContent(content);
      setIsTyping(false);
      highlightImportantTerms(content);
    }
  }, [content, isLoading, displayedContent, skipTypewriter, typingSpeed]);

  // Handle click to skip typewriter effect
  const handleContentClick = () => {
    if (isTyping && content) {
      setSkipTypewriter(true);
      setDisplayedContent(content);
      setIsTyping(false);
      highlightImportantTerms(content);
    }
  };
  
  // Highlight important terms in the content
  const highlightImportantTerms = (text: string) => {
    let processedContent = text;
    
    // Default terms to highlight if none provided
    const termsToHighlight = highlightTerms.length > 0 
      ? highlightTerms 
      : [
        "important", "critical", "significant", "key", "vital", "essential",
        "murder", "victim", "suspect", "weapon", "evidence", "fingerprint",
        "blood", "secret", "hidden", "mysterious", "strange", "unusual",
        "connection", "related", "link", "pattern", "clue", "mystery"
      ];
    
    // Highlight terms with proper HTML
    termsToHighlight.forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      processedContent = processedContent.replace(
        regex, 
        '<span class="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">$1</span>'
      );
    });
    
    setHighlightedContent(processedContent);
  };

  // Generate random dot patterns for the loading animation
  const generateDotPattern = () => {
    return Array(3).fill(0).map((_, i) => (
      <div 
        key={i} 
        className={`animate-pulse h-2 w-2 bg-primary rounded-full delay-${i * 150}`}
        style={{ animationDelay: `${i * 0.15}s` }}
      ></div>
    ));
  };

  return (
    <div className="space-y-3">
      {title && <h3 className="text-xl font-semibold border-b pb-2">{title}</h3>}
      
      <div 
        ref={contentRef}
        className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none max-h-96 overflow-y-auto pr-1 pb-1"
        onClick={handleContentClick}
      >
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="flex space-x-2">
              {generateDotPattern()}
            </div>
            <span className="text-muted-foreground text-sm">
              The detective is analyzing the scene...
            </span>
          </div>
        ) : (
          <div className="relative">
            {isTyping ? (
              <>
                <ReactMarkdown>{displayedContent}</ReactMarkdown>
                <span className="inline-block w-1 h-5 bg-primary animate-blink ml-1"></span>
                <div className="absolute bottom-0 right-0 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md">
                  Click to reveal all text
                </div>
              </>
            ) : (
              skipTypewriter ? (
                <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
              ) : (
                <ReactMarkdown>{displayedContent}</ReactMarkdown>
              )
            )}
          </div>
        )}
      </div>
      
      {!isLoading && !isTyping && (
        <div className="flex justify-end">
          <button 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              if (contentRef.current) {
                contentRef.current.scrollTop = 0;
              }
            }}
          >
            Scroll to top
          </button>
        </div>
      )}
    </div>
  );
} 