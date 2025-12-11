import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import * as genaiService from './services/genaiService';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

// Mock the services
vi.mock('./services/genaiService', () => ({
  generateImageFromText: vi.fn(),
  generateVideoFromText: vi.fn(),
  checkApiKeySelection: vi.fn(() => Promise.resolve(true)),
  openApiKeySelection: vi.fn(),
}));

// Mock window functions
const mockScrollIntoView = vi.fn();
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
window.confirm = vi.fn(() => true);

// Mock SpeechRecognition
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockAbort = vi.fn();
let recognitionInstance: any = null;

const MockSpeechRecognition = vi.fn(() => {
  recognitionInstance = {
    start: mockStart,
    stop: mockStop,
    abort: mockAbort,
    lang: '',
    continuous: true, 
    interimResults: true,
    onresult: null,
    onend: null,
    onerror: null,
    onstart: null,
  };
  return recognitionInstance;
});

window.SpeechRecognition = MockSpeechRecognition as any;
window.webkitSpeechRecognition = MockSpeechRecognition as any;

describe('DreamStream App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recognitionInstance = null;
  });

  it('renders the initial UI correctly', () => {
    render(<App />);
    expect(screen.getByText(/DreamStream/i)).toBeInTheDocument();
    expect(screen.getByText(/Empty Canvas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Recording/i)).toBeInTheDocument();
  });

  it('Maintains Scene Consistency: Passes reference image to subsequent generations', async () => {
     render(<App />);
     
     // 1. First Generation (Initial Scene)
     const micButton = screen.getByLabelText('Start Recording');
     fireEvent.click(micButton);
     act(() => { if (recognitionInstance.onstart) recognitionInstance.onstart(); });

     const firstPrompt = "A futuristic city";
     const firstImageResult = "data:image/png;base64,fakeInitialImage";

     (genaiService.generateImageFromText as Mock).mockResolvedValue(firstImageResult);

     // Simulate speech input
     await act(async () => {
         if (recognitionInstance.onresult) recognitionInstance.onresult({
             resultIndex: 0,
             results: [{ isFinal: true, 0: { transcript: firstPrompt } }]
         });
     });

     // Wait for image to "load" into state
     await waitFor(() => {
        const imgs = screen.getAllByRole('img');
        expect(imgs.some((img: any) => img.src === firstImageResult)).toBe(true);
     });

     // 2. Second Generation (Continuity Update)
     const secondPrompt = "Add flying cars";
     const secondImageResult = "data:image/png;base64,fakeSecondImage";
     (genaiService.generateImageFromText as Mock).mockResolvedValue(secondImageResult);

     await act(async () => {
         if (recognitionInstance.onresult) recognitionInstance.onresult({
             resultIndex: 1, 
             results: [{ isFinal: true, 0: { transcript: secondPrompt } }]
         });
     });

     await waitFor(() => {
         expect(genaiService.generateImageFromText).toHaveBeenCalledWith(
             secondPrompt, 
             `${firstPrompt}. ${secondPrompt}`, 
             firstImageResult, 
             'None', 
             expect.any(Number)
         );
     });
  });

  it('Undo/Redo functionality works', async () => {
      render(<App />);
      
      const micButton = screen.getByLabelText('Start Recording');
      fireEvent.click(micButton);
      act(() => { if (recognitionInstance.onstart) recognitionInstance.onstart(); });

      // 1. Generate First Item
      (genaiService.generateImageFromText as Mock).mockResolvedValue("data:image/png;base64,1");
      await act(async () => {
         if (recognitionInstance.onresult) recognitionInstance.onresult({
             resultIndex: 0,
             results: [{ isFinal: true, 0: { transcript: "First" } }]
         });
      });
      await waitFor(() => screen.getByAltText(/First/i));

      // 2. Generate Second Item
      (genaiService.generateImageFromText as Mock).mockResolvedValue("data:image/png;base64,2");
      await act(async () => {
         if (recognitionInstance.onresult) recognitionInstance.onresult({
             resultIndex: 1,
             results: [{ isFinal: true, 0: { transcript: "Second" } }]
         });
      });
      await waitFor(() => screen.getByAltText(/Second/i));

      // 3. Undo
      const undoBtn = screen.getByTitle(/Undo/i);
      fireEvent.click(undoBtn);
      
      // Should show First again
      await waitFor(() => expect(screen.getByAltText(/First/i)).toBeInTheDocument());

      // 4. Redo
      const redoBtn = screen.getByTitle(/Redo/i);
      fireEvent.click(redoBtn);
      
      // Should show Second again
      await waitFor(() => expect(screen.getByAltText(/Second/i)).toBeInTheDocument());
  });

  it('Undo via Voice Command', async () => {
      render(<App />);
      const micButton = screen.getByLabelText('Start Recording');
      fireEvent.click(micButton);
      
      // Generate 2 items
      (genaiService.generateImageFromText as Mock).mockResolvedValue("data:image/png;base64,1");
      await act(async () => {
          if (recognitionInstance.onresult) recognitionInstance.onresult({
              resultIndex: 0,
              results: [{ isFinal: true, 0: { transcript: "First" } }]
          });
      });
      await waitFor(() => screen.getByAltText(/First/i));

      (genaiService.generateImageFromText as Mock).mockResolvedValue("data:image/png;base64,2");
      await act(async () => {
          if (recognitionInstance.onresult) recognitionInstance.onresult({
              resultIndex: 1,
              results: [{ isFinal: true, 0: { transcript: "Second" } }]
          });
      });
      await waitFor(() => screen.getByAltText(/Second/i));

      // Say "Undo"
      await act(async () => {
          if (recognitionInstance.onresult) recognitionInstance.onresult({
              resultIndex: 2,
              results: [{ isFinal: true, 0: { transcript: "Undo" } }]
          });
      });

      // Should verify we went back to first
      await waitFor(() => expect(screen.getByAltText(/First/i)).toBeInTheDocument());
  });
});