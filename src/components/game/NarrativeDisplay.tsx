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
  const [errorState, setErrorState] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Ensure content is treated as a string
  const safeContent = typeof content === 'string' ? content : 
                     (content ? String(content) : "No content available.");
  
  // Reset state when content changes
  useEffect(() => {
    if (isLoading) {
      setErrorState(null);
    }
  }, [isLoading]);
  
  // Typewriter effect for narrative text
  useEffect(() => {
    if (isLoading) {
      setDisplayedContent("");
      setIsTyping(false);
      setErrorState(null);
      return;
    }
    
    // Safety check for content
    if (!safeContent) {
      setErrorState("No narrative content available. Try regenerating or examining another clue.");
      return;
    }
    
    if (safeContent && safeContent !== displayedContent && !skipTypewriter) {
      setIsTyping(true);
      let index = 0;
      const timer = setInterval(() => {
        try {
          if (index < safeContent.length) {
            setDisplayedContent(safeContent.substring(0, index + 1));
            index++;
            
            // Auto-scroll to keep up with the text
            if (contentRef.current) {
              contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }
          } else {
            clearInterval(timer);
            setIsTyping(false);
            highlightImportantTerms(safeContent);
          }
        } catch (error) {
          console.error("Error in typewriter effect:", error);
          clearInterval(timer);
          setIsTyping(false);
          setErrorState("An error occurred while displaying the narrative.");
        }
      }, typingSpeed); // Speed of typing
      
      return () => clearInterval(timer);
    } else if (skipTypewriter && safeContent) {
      setDisplayedContent(safeContent);
      setIsTyping(false);
      highlightImportantTerms(safeContent);
    }
  }, [safeContent, isLoading, displayedContent, skipTypewriter, typingSpeed]);

  // Handle click to skip typewriter effect
  const handleContentClick = () => {
    if (isTyping && safeContent) {
      setSkipTypewriter(true);
      setDisplayedContent(safeContent);
      setIsTyping(false);
      highlightImportantTerms(safeContent);
    }
  };
  
  // Highlight important terms in the content
  const highlightImportantTerms = (text: string) => {
    try {
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
    } catch (error) {
      console.error("Error highlighting terms:", error);
      // If highlighting fails, just use the plain content
      setHighlightedContent(text);
    }
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

  // Render loading state, error state, or content
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="flex space-x-2">
            {generateDotPattern()}
          </div>
          <span className="text-muted-foreground text-sm">
            The detective is analyzing the scene...
          </span>
        </div>
      );
    }
    
    if (errorState) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md text-red-600 dark:text-red-300">
          <p>{errorState}</p>
          <button 
            onClick={() => setErrorState(null)}
            className="text-xs underline mt-2"
          >
            Dismiss
          </button>
        </div>
      );
    }
    
    if (isTyping) {
      return (
        <>
          <ReactMarkdown>{displayedContent}</ReactMarkdown>
          <span className="inline-block w-1 h-5 bg-primary animate-blink ml-1"></span>
          <div className="absolute bottom-0 right-0 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md">
            Click to reveal all text
          </div>
        </>
      );
    }
    
    if (skipTypewriter) {
      return <div className="prose-sm" dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
    }
    
    return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
  };

  return (
    <div className="space-y-3">
      {title && <h3 className="text-xl font-semibold border-b pb-2">{title}</h3>}
      
      <div 
        ref={contentRef}
        className="prose prose-sm md:prose-base dark:prose-invert max-w-none max-h-96 overflow-y-auto pr-1 pb-1 relative"
        onClick={handleContentClick}
      >
        {renderContent()}
      </div>
      
      {!isLoading && !isTyping && !errorState && (
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