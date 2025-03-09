"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/game-context";

export default function DetectiveNotebook() {
  const { 
    clues,
    notes,
    addNote,
    deleteNote
  } = useGame();
  
  const [activeTab, setActiveTab] = useState<'notes' | 'clues'>('notes');
  const [noteText, setNoteText] = useState<string>('');
  const [autoSave, setAutoSave] = useState<NodeJS.Timeout | null>(null);
  
  // Get all discovered clues
  const discoveredClues = clues.filter(clue => clue.discovered);

  // Auto-save note when user types
  useEffect(() => {
    if (autoSave) {
      clearTimeout(autoSave);
    }
    
    if (noteText.trim()) {
      const timer = setTimeout(() => {
        // Add a new note
        addNote(noteText);
        setNoteText('');
      }, 2000);
      
      setAutoSave(timer);
    }
    
    return () => {
      if (autoSave) clearTimeout(autoSave);
    };
  }, [noteText, addNote]);

  // Handle note changes
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteText(e.target.value);
  };

  return (
    <Card className="w-full border-t-4 border-t-primary shadow-lg overflow-hidden">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="flex items-center">
            <span className="mr-2">📓</span>
            Detective&apos;s Notebook
          </span>
          <div className="flex text-sm font-normal space-x-1">
            <Button 
              variant={activeTab === 'notes' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveTab('notes')}
              className="text-xs h-8"
            >
              Notes
            </Button>
            <Button 
              variant={activeTab === 'clues' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveTab('clues')}
              className="text-xs h-8"
            >
              Evidence
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-4 space-y-4">
            {/* Detective's Notes */}
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <span className="mr-2">✏️</span>
                Your Case Notes
              </h3>
              <Textarea
                placeholder="Take notes about the case here... What connections do you see between the clues? What theories are you developing?"
                className="min-h-[200px] notebook-paper p-4 leading-relaxed"
                value={noteText}
                onChange={handleNoteChange}
              />
              <p className="text-xs text-muted-foreground mt-1">Notes auto-save as you type...</p>
            </div>

            {/* Saved Notes */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center">
                <span className="mr-2">📝</span>
                Saved Notes
              </h3>
              
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded">
                  No notes yet. Start writing above to add notes.
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="p-3 bg-muted/30 rounded border-l-2 border-primary">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-xs text-muted-foreground">
                          {new Date(note.timestamp).toLocaleString()}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => deleteNote(note.id)}
                        >
                          ✕
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Clues/Evidence Tab */}
        {activeTab === 'clues' && (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <span className="mr-2">🔍</span>
              Discovered Evidence ({discoveredClues.length}/{clues.length})
            </h3>
            
            {discoveredClues.length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">No evidence discovered yet. Search the scenes carefully and take actions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {discoveredClues.map(clue => (
                  <div 
                    key={clue.id} 
                    className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary"
                  >
                    <h4 className="font-bold text-lg">{clue.name}</h4>
                    <p className="mt-1 mb-2">{clue.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Scene: {clue.sceneId}</span>
                      <span>Clue #{clue.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 