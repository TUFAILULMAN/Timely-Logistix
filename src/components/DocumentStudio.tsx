/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Signature, 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Plus, 
  Trash2, 
  Layers, 
  FileImage, 
  ArrowRight,
  Sun,
  Eye,
  CheckCircle,
  FileDown,
  RotateCw,
  Contrast
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function DocumentStudio() {
  // Tabs: 'editor' | 'converter' | 'enhancer' | 'merger'
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'converter' | 'enhancer' | 'merger'>('editor');

  // --- PDF EDITOR & SIGNER STATE ---
  const [editorTextItems, setEditorTextItems] = useState<{ id: string; text: string; x: number; y: number; fontSize: number; color: string }[]>([]);
  const [editorSigItems, setEditorSigItems] = useState<{ id: string; svgData: string; x: number; y: number; width: number; height: number }[]>([]);
  const [editorBgImage, setEditorBgImage] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<{ id: string; type: 'text' | 'sig'; offsetX: number; offsetY: number } | null>(null);
  
  // Signature pad states
  const [sigType, setSigType] = useState<'DRAW' | 'TYPE'>('DRAW');
  const [typedSigName, setTypedSigName] = useState('');
  const [typedSigFont, setTypedSigFont] = useState('font-signature-caveat'); // Tailwind proxy font name
  const [sigDrawColor, setSigDrawColor] = useState('#000000');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Editor canvas ref for drag & drop coordinate calc
  const editorBoardRef = useRef<HTMLDivElement | null>(null);

  // Text inputs
  const [newTextValue, setNewTextValue] = useState('');
  const [newTextSize, setNewTextSize] = useState(16);
  const [newTextColor, setNewTextColor] = useState('#1e293b');

  // --- CONVERTER STATE ---
  const [convFiles, setConvFiles] = useState<{ id: string; file: File; type: string; preview: string }[]>([]);
  const [imgToPdfSize, setImgToPdfSize] = useState<'LETTER' | 'A4' | 'FIT'>('LETTER');

  // --- IMAGE ENHANCER (CAMSCANNER) STATE ---
  const [enhancerImage, setEnhancerImage] = useState<string | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);
  const [contrastVal, setContrastVal] = useState(25);
  const [brightnessVal, setBrightnessVal] = useState(10);
  const [enhancementMode, setEnhancementMode] = useState<'NONE' | 'ULTRA_BW' | 'GRAY' | 'SHARP'>('ULTRA_BW');
  const [rotationAngle, setRotationAngle] = useState(0); // 0, 90, 180, 270

  // --- MERGER STATE ---
  const [mergerFiles, setMergerFiles] = useState<{ id: string; name: string; size: string; preview: string; fileType: string }[]>([]);

  // ------------------------------------
  // EDITOR SIGNATURE DRAWING PAD ROUTINES
  // ------------------------------------
  useEffect(() => {
    if (activeSubTab === 'editor' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = sigDrawColor;
      }
    }
  }, [activeSubTab, sigDrawColor, sigType]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearDrawingPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  // Convert Drawn signature pad or typed signature to image and inject onto document
  const handleApplySignatureToDoc = () => {
    let sigUrl = '';
    
    if (sigType === 'DRAW') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      sigUrl = canvas.toDataURL('image/png');
    } else {
      // Create temporary canvas to render typed signature with artistic fonts
      if (!typedSigName.trim()) {
        alert('Please type a name to generate a signature!');
        return;
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 320;
      tempCanvas.height = 100;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 320, 100);
        ctx.fillStyle = sigDrawColor;
        
        // Select matching font family based on choice
        let fontStr = 'italic 32px cursive';
        if (typedSigFont === 'font-signature-caveat') {
          fontStr = 'italic 34px "Caveat", "Brush Script MT", cursive';
        } else if (typedSigFont === 'font-signature-brush') {
          fontStr = '30px "Brush Script MT", cursive';
        } else {
          fontStr = '32px "Lucida Handwriting", cursive';
        }

        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSigName, 160, 50);
        sigUrl = tempCanvas.toDataURL('image/png');
      }
    }

    if (sigUrl) {
      const newSig = {
        id: `sig-${Date.now()}`,
        svgData: sigUrl,
        x: 50,
        y: 150,
        width: 140,
        height: 60
      };
      setEditorSigItems(prev => [...prev, newSig]);
      clearDrawingPad();
      setTypedSigName('');
    }
  };

  // Upload background PDF/Image statement template
  const handleEditorBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditorBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add text to document
  const handleAddTextToDoc = () => {
    if (!newTextValue.trim()) return;
    const item = {
      id: `txt-${Date.now()}`,
      text: newTextValue,
      x: 80,
      y: 100,
      fontSize: newTextSize,
      color: newTextColor
    };
    setEditorTextItems(prev => [...prev, item]);
    setNewTextValue('');
  };

  // DRAG & DROP LOGIC ON THE DOCUMENT CANVAS BOARD
  const handleItemMouseDown = (id: string, type: 'text' | 'sig', e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.currentTarget.getBoundingClientRect();
    setDragItem({
      id,
      type,
      offsetX: e.clientX - target.left,
      offsetY: e.clientY - target.top
    });
  };

  const handleBoardMouseMove = (e: React.MouseEvent) => {
    if (!dragItem || !editorBoardRef.current) return;
    
    const boardRect = editorBoardRef.current.getBoundingClientRect();
    const rawX = e.clientX - boardRect.left - dragItem.offsetX;
    const rawY = e.clientY - boardRect.top - dragItem.offsetY;

    // Constraint within board bounds
    const cleanX = Math.max(0, Math.min(boardRect.width - 50, rawX));
    const cleanY = Math.max(0, Math.min(boardRect.height - 30, rawY));

    if (dragItem.type === 'text') {
      setEditorTextItems(prev => prev.map(t => t.id === dragItem.id ? { ...t, x: cleanX, y: cleanY } : t));
    } else {
      setEditorSigItems(prev => prev.map(s => s.id === dragItem.id ? { ...s, x: cleanX, y: cleanY } : s));
    }
  };

  const handleBoardMouseUp = () => {
    setDragItem(null);
  };

  const handleRemoveTextItem = (id: string) => {
    setEditorTextItems(prev => prev.filter(t => t.id !== id));
  };

  const handleRemoveSigItem = (id: string) => {
    setEditorSigItems(prev => prev.filter(s => s.id !== id));
  };

  // Save signed doc as PDF or JPG
  const handleDownloadEditorResult = () => {
    if (!editorBgImage) {
      alert('Please load a document or blank sheet template first!');
      return;
    }

    // Initialize jspdf
    const doc = new jsPDF('p', 'pt', 'letter');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Draw background image
    doc.addImage(editorBgImage, 'JPEG', 0, 0, width, height);

    // Convert DOM coordinate percents to pdf coordinates
    const board = editorBoardRef.current;
    if (board) {
      const boardW = board.clientWidth;
      const boardH = board.clientHeight;

      // Draw texts
      editorTextItems.forEach(t => {
        const pdfX = (t.x / boardW) * width;
        const pdfY = ((t.y + t.fontSize) / boardH) * height; // adjust baseline
        doc.setFontSize(t.fontSize);
        doc.setTextColor(t.color);
        doc.text(t.text, pdfX, pdfY);
      });

      // Draw signatures
      editorSigItems.forEach(s => {
        const pdfX = (s.x / boardW) * width;
        const pdfY = (s.y / boardH) * height;
        const pdfW = (s.width / boardW) * width;
        const pdfH = (s.height / boardH) * height;
        doc.addImage(s.svgData, 'PNG', pdfX, pdfY, pdfW, pdfH);
      });
    }

    doc.save(`signed_document_${Date.now().toString().slice(-5)}.pdf`);
    alert('Document successfully signed, formatted, and downloaded!');
  };

  // ------------------------------------
  // CONVERTERS & ENHANCERS ROUTINES
  // ------------------------------------
  const handleConverterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        setConvFiles(prev => [...prev, {
          id: `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          file,
          type: file.type,
          preview: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDownloadImagesAsPDF = () => {
    if (convFiles.length === 0) return;

    const doc = new jsPDF('p', 'pt', 'letter');
    const pdfW = doc.internal.pageSize.getWidth();
    const pdfH = doc.internal.pageSize.getHeight();

    convFiles.forEach((f, idx) => {
      if (idx > 0) doc.addPage();
      
      if (imgToPdfSize === 'FIT') {
        doc.addImage(f.preview, 'JPEG', 0, 0, pdfW, pdfH);
      } else {
        // letter margins 40pt
        doc.addImage(f.preview, 'JPEG', 40, 40, pdfW - 80, pdfH - 80);
      }
    });

    doc.save(`converted_images_catalog_${Date.now().toString().slice(-4)}.pdf`);
    alert('Converted images compiled into a single PDF successfully!');
  };

  // Clear converter files
  const handleClearConverter = () => {
    setConvFiles([]);
  };

  // ------------------------------------
  // CAMSCANNER IMAGE ENHANCER ROUTINES
  // ------------------------------------
  const handleEnhancerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEnhancerImage(reader.result as string);
        setEnhancedResult(null);
        setRotationAngle(0);
      };
      reader.readAsDataURL(file);
    }
  };

  // Core Pixel processing for document scanning
  const applyCamScannerFilters = () => {
    if (!enhancerImage) return;

    const img = new Image();
    img.src = enhancerImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle orientation rotations
      if (rotationAngle === 90 || rotationAngle === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationAngle * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Extract pixel buffer
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Filter settings
      const factor = (259 * (contrastVal + 255)) / (255 * (259 - contrastVal));
      const bOffset = brightnessVal;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Brightness adjust
        r += bOffset;
        g += bOffset;
        b += bOffset;

        // 2. Contrast adjust
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;

        // Convert based on selected mode
        if (enhancementMode === 'GRAY' || enhancementMode === 'ULTRA_BW') {
          // Standard luma coefficients
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          if (enhancementMode === 'ULTRA_BW') {
            // High contrast threshold binary split (CamScanner style!)
            const thresh = 120;
            const binary = gray > thresh ? 255 : 0;
            r = binary;
            g = binary;
            b = binary;
          } else {
            r = gray;
            g = gray;
            b = gray;
          }
        } else if (enhancementMode === 'SHARP') {
          // Boost high-frequency elements slightly
          r = Math.min(255, Math.max(0, r * 1.15));
          g = Math.min(255, Math.max(0, g * 1.15));
          b = Math.min(255, Math.max(0, b * 1.15));
        }

        // Clamp pixel values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);
      setEnhancedResult(canvas.toDataURL('image/jpeg', 0.95));
    };
  };

  // Automatically process when rotation or modes change
  useEffect(() => {
    if (enhancerImage) {
      applyCamScannerFilters();
    }
  }, [enhancerImage, contrastVal, brightnessVal, enhancementMode, rotationAngle]);

  const handleDownloadEnhancedImage = () => {
    if (!enhancedResult) return;
    const link = document.createElement('a');
    link.href = enhancedResult;
    link.download = `camscanner_enhanced_${Date.now().toString().slice(-4)}.jpg`;
    link.click();
  };

  // ------------------------------------
  // MERGER ROUTINES
  // ------------------------------------
  const handleMergerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        setMergerFiles(prev => [...prev, {
          id: `merge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          preview: reader.result as string,
          fileType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMergeAndDownload = () => {
    if (mergerFiles.length === 0) return;

    const doc = new jsPDF('p', 'pt', 'letter');
    const pdfW = doc.internal.pageSize.getWidth();
    const pdfH = doc.internal.pageSize.getHeight();

    mergerFiles.forEach((item, idx) => {
      if (idx > 0) doc.addPage();
      
      // Since we read files as dataURLs, we can draw them directly onto full letter pages
      doc.addImage(item.preview, 'JPEG', 0, 0, pdfW, pdfH);
    });

    doc.save(`merged_document_bundle_${Date.now().toString().slice(-4)}.pdf`);
    alert(`Successfully merged ${mergerFiles.length} file(s) into one consolidated PDF archive!`);
  };

  const handleRemoveMergerFile = (id: string) => {
    setMergerFiles(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div id="document_studio" className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display flex items-center gap-2">
            <Signature className="h-5.5 w-5.5 text-blue-600" />
            <span>DAT Document Studio &amp; PDF Editors</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Draw custom signatures, sign rate confirmations, scan-enhance blurry invoices, and merge multiple documents in one click.
          </p>
        </div>

        {/* Sub-tab selection row */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSubTab('editor')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'editor' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>Sign &amp; Edit PDF</span>
          </button>
          <button
            onClick={() => setActiveSubTab('enhancer')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'enhancer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>CamScanner Enhancer</span>
          </button>
          <button
            onClick={() => setActiveSubTab('converter')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'converter' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileImage className="h-3.5 w-3.5" />
            <span>JPG ⇄ PDF</span>
          </button>
          <button
            onClick={() => setActiveSubTab('merger')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'merger' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Merge Files</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------
          TAB 1: DOCUMENT EDITOR & SIGNER
          ------------------------------------ */}
      {activeSubTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Side Panel (cols 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Template Upload */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Step 1: Upload Statement</span>
              </h3>
              <p className="text-[10px] text-slate-500 leading-normal">
                Upload any Rate Confirmation, Carrier agreement, or invoice to sign and customize.
              </p>
              
              <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-4 transition-all text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditorBgUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <ImageIcon className="h-8 w-8 mx-auto text-slate-400" />
                  <div className="text-xs font-bold text-blue-600">Choose Image or Scan</div>
                  <div className="text-[9px] text-slate-400">JPG, PNG, WebP up to 10MB</div>
                </div>
              </div>

              {/* Sample statement button */}
              <button
                onClick={() => {
                  // Use blank slate white background
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = 612; // letter size
                  tempCanvas.height = 792;
                  const ctx = tempCanvas.getContext('2d');
                  if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, 612, 792);
                    // Add watermark borders
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.lineWidth = 15;
                    ctx.strokeRect(0, 0, 612, 792);
                    // Header text
                    ctx.fillStyle = '#1e293b';
                    ctx.font = 'bold 24px sans-serif';
                    ctx.fillText('TIMELY LOGISTIX AGENT STATEMENT', 50, 80);
                    ctx.font = 'normal 12px sans-serif';
                    ctx.fillStyle = '#64748b';
                    ctx.fillText('Authorized Dispatch & Freight Brokerage Carriage Order', 50, 105);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.beginPath();
                    ctx.moveTo(50, 125);
                    ctx.lineTo(562, 125);
                    ctx.stroke();

                    setEditorBgImage(tempCanvas.toDataURL('image/jpeg'));
                    alert('Loaded official blank Statement Template!');
                  }
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Use Blank Slate Statement Template
              </button>
            </div>

            {/* Signature Creator Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Signature className="h-4 w-4 text-blue-600" />
                <span>Step 2: Generate Signature</span>
              </h3>

              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-[10px] font-bold">
                <button
                  onClick={() => setSigType('DRAW')}
                  className={`flex-1 py-1 rounded transition-all ${sigType === 'DRAW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Draw Signature
                </button>
                <button
                  onClick={() => setSigType('TYPE')}
                  className={`flex-1 py-1 rounded transition-all ${sigType === 'TYPE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Type Signature
                </button>
              </div>

              {sigType === 'DRAW' ? (
                <div className="space-y-3">
                  <div className="relative border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={120}
                      className="w-full bg-slate-50 cursor-crosshair block touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <button
                      onClick={clearDrawingPad}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold rounded"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Enter Signing Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      placeholder="e.g. Authorized Agent"
                      value={typedSigName}
                      onChange={e => setTypedSigName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Select Font Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTypedSigFont('font-signature-caveat')}
                        className={`p-1.5 text-xs text-center border rounded-lg ${typedSigFont === 'font-signature-caveat' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-slate-200'}`}
                        style={{ fontFamily: '"Caveat", cursive' }}
                      >
                        Artistic
                      </button>
                      <button
                        onClick={() => setTypedSigFont('font-signature-brush')}
                        className={`p-1.5 text-xs text-center border rounded-lg ${typedSigFont === 'font-signature-brush' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-slate-200'}`}
                        style={{ fontFamily: '"Brush Script MT", cursive' }}
                      >
                        Script
                      </button>
                      <button
                        onClick={() => setTypedSigFont('font-signature-hand')}
                        className={`p-1.5 text-xs text-center border rounded-lg ${typedSigFont === 'font-signature-hand' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-slate-200'}`}
                        style={{ fontFamily: '"Lucida Handwriting", cursive' }}
                      >
                        Handwrite
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Color options */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-500 uppercase">Ink Color</span>
                <div className="flex gap-2">
                  {['#000000', '#0000ff', '#1e3a8a', '#10b981'].map(color => (
                    <button
                      key={color}
                      onClick={() => setSigDrawColor(color)}
                      className={`h-5 w-5 rounded-full border shrink-0 transition-all ${
                        sigDrawColor === color ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleApplySignatureToDoc}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Insert Signature onto Document
              </button>
            </div>

            {/* Custom Text Builder */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="h-4 w-4 text-blue-600" />
                <span>Step 3: Insert Custom Text</span>
              </h3>

              <div className="space-y-3">
                <textarea
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-16 resize-none"
                  placeholder="Type any text or dynamic reference detail here..."
                  value={newTextValue}
                  onChange={e => setNewTextValue(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Font Size</label>
                    <select
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      value={newTextSize}
                      onChange={e => setNewTextSize(Number(e.target.value))}
                    >
                      {[10, 12, 14, 16, 18, 22, 28].map(size => (
                        <option key={size} value={size}>{size}px</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Text Color</label>
                    <div className="flex gap-1.5 mt-1">
                      {['#1e293b', '#b91c1c', '#15803d', '#1d4ed8'].map(color => (
                        <button
                          key={color}
                          onClick={() => setNewTextColor(color)}
                          className={`h-5.5 w-5.5 rounded-lg border ${newTextColor === color ? 'ring-2 ring-blue-500' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddTextToDoc}
                  className="w-full py-2 bg-slate-850 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Add Text to Statement
                </button>
              </div>
            </div>

          </div>

          {/* Interactive Document Workspace Board (cols 8) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">
                💡 <strong>How to Sign:</strong> Drag and drop the signatures and text items anywhere on the statement block.
              </span>
              <button
                onClick={handleDownloadEditorResult}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Signed PDF</span>
              </button>
            </div>

            <div className="bg-slate-350 p-6 rounded-2xl border border-slate-200/80 shadow-inner flex items-center justify-center overflow-x-auto min-h-[500px]">
              {editorBgImage ? (
                <div
                  ref={editorBoardRef}
                  onMouseMove={handleBoardMouseMove}
                  onMouseUp={handleBoardMouseUp}
                  onMouseLeave={handleBoardMouseUp}
                  className="relative bg-white shadow-2xl rounded border border-slate-300 origin-center overflow-hidden shrink-0"
                  style={{
                    width: '612px',  // Standard 8.5 x 11 ratio
                    height: '792px',
                    backgroundImage: `url(${editorBgImage})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Text overlay items */}
                  {editorTextItems.map(t => (
                    <div
                      key={t.id}
                      onMouseDown={(e) => handleItemMouseDown(t.id, 'text', e)}
                      className="absolute cursor-move select-none p-1 border border-transparent hover:border-blue-500 hover:bg-blue-50/20 rounded group transition-all"
                      style={{
                        left: `${t.x}px`,
                        top: `${t.y}px`,
                        fontSize: `${t.fontSize}px`,
                        color: t.color,
                        lineHeight: 1.1
                      }}
                    >
                      <span>{t.text}</span>
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => handleRemoveTextItem(t.id)}
                        className="hidden group-hover:inline-flex items-center justify-center ml-2 text-red-500 bg-white hover:bg-red-50 rounded-full h-4 w-4 border border-slate-200 align-middle text-[10px]"
                        title="Remove Text"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Signature overlay items */}
                  {editorSigItems.map(s => (
                    <div
                      key={s.id}
                      onMouseDown={(e) => handleItemMouseDown(s.id, 'sig', e)}
                      className="absolute cursor-move select-none p-1 border border-transparent hover:border-blue-500 hover:bg-blue-50/20 rounded group"
                      style={{
                        left: `${s.x}px`,
                        top: `${s.y}px`,
                        width: `${s.width}px`,
                        height: `${s.height}px`,
                      }}
                    >
                      <img
                        src={s.svgData}
                        alt="Signature Block"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => handleRemoveSigItem(s.id)}
                        className="hidden group-hover:inline-flex items-center justify-center absolute -top-2 -right-2 text-red-500 bg-white hover:bg-red-50 rounded-full h-4.5 w-4.5 border border-slate-200 text-xs shadow-md"
                        title="Remove Signature"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 text-slate-500 space-y-3">
                  <ImageIcon className="h-16 w-16 mx-auto text-slate-400 opacity-60 animate-pulse" />
                  <p className="text-sm font-bold">No Statement Template loaded</p>
                  <p className="text-xs text-slate-400">Please select "Blank Slate Statement" or upload an image above to start editing.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------
          TAB 2: CAMSCANNER IMAGE ENHANCER
          ------------------------------------ */}
      {activeSubTab === 'enhancer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Enhancer Controls */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Contrast className="h-4.5 w-4.5 text-blue-600" />
                <span>CamScanner Processor</span>
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Restore low-light, blurry, or low-contrast photos of receipts, bills of lading, and rate confirmations into print-ready, high-contrast documents.
              </p>
            </div>

            {/* Upload form */}
            <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 transition-all text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleEnhancerUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <ImageIcon className="h-10 w-10 mx-auto text-slate-400" />
                <div className="text-xs font-bold text-blue-600">Choose Blurry Receipt Image</div>
                <div className="text-[10px] text-slate-400">Take a photo from your phone or drag it here</div>
              </div>
            </div>

            {/* Filter Slider configuration */}
            {enhancerImage && (
              <div className="space-y-4 pt-3 border-t border-slate-150">
                
                {/* Processing Mode */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Enhancement Engine</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setEnhancementMode('ULTRA_BW')}
                      className={`py-1.5 px-3 border rounded-lg text-xs font-semibold ${enhancementMode === 'ULTRA_BW' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200'}`}
                    >
                      📄 Ultra B&amp;W Threshold
                    </button>
                    <button
                      onClick={() => setEnhancementMode('GRAY')}
                      className={`py-1.5 px-3 border rounded-lg text-xs font-semibold ${enhancementMode === 'GRAY' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200'}`}
                    >
                      🪙 Sharp Grayscale
                    </button>
                    <button
                      onClick={() => setEnhancementMode('SHARP')}
                      className={`py-1.5 px-3 border rounded-lg text-xs font-semibold ${enhancementMode === 'SHARP' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200'}`}
                    >
                      ✨ High Contrast Color
                    </button>
                    <button
                      onClick={() => setEnhancementMode('NONE')}
                      className={`py-1.5 px-3 border rounded-lg text-xs font-semibold ${enhancementMode === 'NONE' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200'}`}
                    >
                      Original
                    </button>
                  </div>
                </div>

                {/* Contrast control */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-600 uppercase">Contrast Level</span>
                    <strong className="text-slate-800">{contrastVal}%</strong>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    value={contrastVal}
                    onChange={e => setContrastVal(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Brightness control */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-600 uppercase">Brightness Offset</span>
                    <strong className="text-slate-800">+{brightnessVal}%</strong>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="80"
                    value={brightnessVal}
                    onChange={e => setBrightnessVal(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Rotate control */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Orientation Rotate</label>
                  <button
                    onClick={() => setRotationAngle(prev => (prev + 90) % 360)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl w-full justify-center transition-all cursor-pointer"
                  >
                    <RotateCw className="h-4 w-4" />
                    <span>Rotate 90° Clockwise</span>
                  </button>
                </div>

                {/* Clear Result button */}
                <button
                  onClick={() => {
                    setEnhancerImage(null);
                    setEnhancedResult(null);
                  }}
                  className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Clear Active Document
                </button>
              </div>
            )}

          </div>

          {/* Enhancer Preview Side */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {enhancerImage && (
              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-600 font-bold">⚡ Document Enhancer Workspace</span>
                <button
                  onClick={handleDownloadEnhancedImage}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Ultra-Clear JPG</span>
                </button>
              </div>
            )}

            <div className="bg-slate-200/60 p-6 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[480px]">
              {enhancerImage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  
                  {/* Original Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-300/80 shadow text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Original blurry scan</div>
                    <div className="aspect-[3/4] rounded-lg border border-slate-100 overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img
                        src={enhancerImage}
                        alt="Original Blurry"
                        className="max-h-[350px] w-auto object-contain"
                      />
                    </div>
                  </div>

                  {/* Processed/Enhanced Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow text-center">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Ultra-clear processed doc</div>
                    <div className="aspect-[3/4] rounded-lg border border-slate-100 overflow-hidden bg-white flex items-center justify-center">
                      {enhancedResult ? (
                        <img
                          src={enhancedResult}
                          alt="Enhanced Document"
                          className="max-h-[350px] w-auto object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 animate-pulse text-xs">Running CamScanner filters...</div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center p-12 text-slate-500 space-y-3">
                  <ImageIcon className="h-16 w-16 mx-auto text-slate-400 opacity-60 animate-pulse" />
                  <p className="text-sm font-bold">No Document uploaded for Scan Enhancement</p>
                  <p className="text-xs text-slate-400">Please choose a blurry page, driver license, or receipt photo to clean.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------
          TAB 3: JPG TO PDF & PDF TO JPG CONVERTERS
          ------------------------------------ */}
      {activeSubTab === 'converter' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">JPG/PNG to PDF Statement Converter</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select multiple photos of freight delivery notes or broker rate confirmations, compile them in sequence, and export them as a single clean PDF catalog file.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Upload Panel */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Step 1: Choose Files</label>
              
              <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-8 transition-all text-center bg-slate-50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleConverterFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <ImageIcon className="h-10 w-10 mx-auto text-slate-400" />
                  <div className="text-xs font-bold text-blue-600">Select Multiple Images</div>
                  <div className="text-[10px] text-slate-400">Ctrl + Click to choose many</div>
                </div>
              </div>

              {convFiles.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">PDF Page Layout</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['LETTER', 'A4', 'FIT'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setImgToPdfSize(opt as any)}
                          className={`py-1.5 px-2 border rounded-lg text-xs font-semibold text-center ${imgToPdfSize === opt ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-slate-200'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadImagesAsPDF}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileDown className="h-4.5 w-4.5" />
                    <span>Compile &amp; Download PDF</span>
                  </button>

                  <button
                    onClick={handleClearConverter}
                    className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Clear Files list
                  </button>
                </div>
              )}
            </div>

            {/* Right Catalog previews */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Catalog Pages compilation ({convFiles.length} item(s) selected)
              </label>

              {convFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border border-slate-200 p-4 rounded-xl bg-slate-50/50 max-h-[360px] overflow-y-auto">
                  {convFiles.map((f, idx) => (
                    <div key={f.id} className="bg-white border border-slate-200 p-2 rounded-xl text-center space-y-2 relative group">
                      <div className="absolute top-1.5 left-1.5 h-5 w-5 bg-blue-600 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div className="aspect-[3/4] overflow-hidden rounded bg-slate-100 border border-slate-100 flex items-center justify-center">
                        <img
                          src={f.preview}
                          alt="preview page"
                          className="max-h-24 w-auto object-contain"
                        />
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono truncate max-w-full px-1">
                        {f.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-slate-200 border-dashed rounded-xl p-16 text-center text-slate-400 italic bg-slate-50/20">
                  No images uploaded yet. Upload delivery slips, license credentials, or receipt pages to compile.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------
          TAB 4: PDF & IMAGE MERGER
          ------------------------------------ */}
      {activeSubTab === 'merger' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Consolidate &amp; Merge PDF Document Bundles</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select multiple driver slips, BOLs, rate confirmations, or receipt sheets to merge into one single master PDF file for factoring submittal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Upload form merger panel */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Upload Files to Merge</label>
              
              <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-8 transition-all text-center bg-slate-50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMergerUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <ImageIcon className="h-10 w-10 mx-auto text-slate-400" />
                  <div className="text-xs font-bold text-blue-600">Select Files to Merge</div>
                  <div className="text-[10px] text-slate-400">Select any pages or document screenshots</div>
                </div>
              </div>

              {mergerFiles.length > 0 && (
                <button
                  onClick={handleMergeAndDownload}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Layers className="h-4 w-4" />
                  <span>Merge into Master PDF Document</span>
                </button>
              )}
            </div>

            {/* List to merge */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Consolidated File Bundle Queue ({mergerFiles.length} file(s) loaded)
              </label>

              {mergerFiles.length > 0 ? (
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50">
                  {mergerFiles.map((m, idx) => (
                    <div key={m.id} className="flex items-center justify-between p-3.5 bg-white text-xs">
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 font-mono text-[10px] font-bold text-slate-400 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="font-semibold text-slate-800">{m.name}</div>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {m.size}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveMergerFile(m.id)}
                        className="text-slate-400 hover:text-red-650 p-1 rounded-lg transition-all"
                        title="Remove from Merge Queue"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-slate-200 border-dashed rounded-xl p-16 text-center text-slate-400 italic bg-slate-50/20">
                  Merge Queue is currently empty. Upload driver files on the left to merge.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
