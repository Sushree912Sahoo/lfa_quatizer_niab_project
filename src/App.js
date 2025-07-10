import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Camera, BarChart3, Settings, AlertCircle, CheckCircle, FileText, Play, Pause, RefreshCw, Crop, RotateCcw, Check, X, ChevronDown, ChevronUp, Download } from 'lucide-react';

const LFAClassifierApp = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [modelSettings, setModelSettings] = useState({
    model_type: 'efficientnet_b0',
    dropout_rate: 0.7,
    learning_rate: 0.0001,
    batch_size: 4,
    num_epochs: 30,
    weight_decay: 0.1
  });

  const [showCropper, setShowCropper] = useState(false);
  const [cropSelection, setCropSelection] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // States for collapsible sections
  const [showClassification, setShowClassification] = useState(true);
  const [showBacterialCount, setShowBacterialCount] = useState(false);
  const [showCellCount, setShowCellCount] = useState(false);

  const fileInputRef = useRef(null);
  const trainingIntervalRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const cropImageRef = useRef(null);

  const classNames = ['1 Microgram', '1 Nanogram', '10 Nanogram', '100 Nanogram'];
  const modelPath = "C:\\Users\\RUTUDHWAJA\\PROJECT_NIAB\\React\\lfa-classifier\\public\\anti_overfitting_model.pth";

  // Bacterial count mapping
  const bacterialCountMap = {
    '1_Microgram': 1000000,
    '1_Nanogram': 1000,
    '10_Nanogram': 10000,
    '100_Nanogram': 100000
  };

  // Cell count mapping
  const cellCountMap = {
    '1_Microgram': 12000,
    '1_Nanogram': 6000,
    '10_Nanogram': 8000,
    '100_Nanogram': 10000
  };

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setCroppedImage(null);
      setResults(null);
      setShowCropper(false);
      setCropSelection(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const getMousePosition = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!cropCanvasRef.current) return;

    const pos = getMousePosition(e, cropCanvasRef.current);
    setIsDragging(true);
    setDragStart(pos);
    setCropSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }, [getMousePosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !cropCanvasRef.current) return;

    const pos = getMousePosition(e, cropCanvasRef.current);
    const width = pos.x - dragStart.x;
    const height = pos.y - dragStart.y;

    setCropSelection({
      x: width < 0 ? pos.x : dragStart.x,
      y: height < 0 ? pos.y : dragStart.y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  }, [isDragging, dragStart, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const drawCropCanvas = useCallback(() => {
    if (!cropCanvasRef.current || !cropImageRef.current) return;

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = cropImageRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (cropSelection) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.clearRect(cropSelection.x, cropSelection.y, cropSelection.width, cropSelection.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropSelection.x, cropSelection.y, cropSelection.width, cropSelection.height);

      const handleSize = 8;
      ctx.fillStyle = '#3B82F6';
      const corners = [
        { x: cropSelection.x - handleSize / 2, y: cropSelection.y - handleSize / 2 },
        { x: cropSelection.x + cropSelection.width - handleSize / 2, y: cropSelection.y - handleSize / 2 },
        { x: cropSelection.x - handleSize / 2, y: cropSelection.y + cropSelection.height - handleSize / 2 },
        { x: cropSelection.x + cropSelection.width - handleSize / 2, y: cropSelection.y + cropSelection.height - handleSize / 2 }
      ];

      corners.forEach(corner => {
        ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
      });
    }
  }, [cropSelection]);

  useEffect(() => {
    if (showCropper) {
      drawCropCanvas();
    }
  }, [showCropper, cropSelection, drawCropCanvas]);

  const applyCrop = useCallback(() => {
    if (!cropSelection || !cropImageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = cropImageRef.current;

    canvas.width = cropSelection.width;
    canvas.height = cropSelection.height;

    ctx.drawImage(
      img,
      cropSelection.x, cropSelection.y, cropSelection.width, cropSelection.height,
      0, 0, cropSelection.width, cropSelection.height
    );

    const croppedDataURL = canvas.toDataURL('image/jpeg', 0.9);
    setCroppedImage(croppedDataURL);
    setShowCropper(false);
    setCropSelection(null);
  }, [cropSelection]);

  const resetCrop = useCallback(() => {
    setCropSelection(null);
    setCroppedImage(null);
    setShowCropper(false);
  }, []);

  const simulateClassification = useCallback(async () => {
    setIsProcessing(true);
    setResults(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResults = {
      predicted_class: Math.floor(Math.random() * 4),
      confidence_scores: [
        Math.random() * 0.4 + 0.1,
        Math.random() * 0.4 + 0.1,
        Math.random() * 0.4 + 0.1,
        Math.random() * 0.4 + 0.1
      ],
      preprocessing_applied: true,
      model_used: modelSettings.model_type,
      image_type: croppedImage ? 'cropped' : 'original',
      timestamp: new Date().toISOString()
    };

    const sum = mockResults.confidence_scores.reduce((a, b) => a + b, 0);
    mockResults.confidence_scores = mockResults.confidence_scores.map(score => score / sum);
    mockResults.confidence_scores[mockResults.predicted_class] = Math.max(
      mockResults.confidence_scores[mockResults.predicted_class],
      0.6
    );

    setResults(mockResults);
    setIsProcessing(false);
  }, [modelSettings.model_type, croppedImage]);

  const downloadReport = useCallback(() => {
    if (!results) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Timestamp', results.timestamp],
      ['Predicted Class', classNames[results.predicted_class]],
      ['Model Used', results.model_used],
      ['Model Path', modelPath],
      ['Image Type', results.image_type],
      ['Preprocessing Applied', results.preprocessing_applied ? 'Yes' : 'No'],
      [''],
      ['Classification Confidence Scores', ''],
      ...classNames.map((name, idx) => [name, `${(results.confidence_scores[idx] * 100).toFixed(2)}%`]),
      [''],
      ['Bacterial Count (CFU/ml)', ''],
      ...classNames.map((name, idx) => {
        const classKey = name.replace(' ', '_');
        return [name, bacterialCountMap[classKey]?.toLocaleString() || 'N/A'];
      }),
      ['Predicted Bacterial Count', bacterialCountMap[classNames[results.predicted_class].replace(' ', '_')]?.toLocaleString() || 'N/A'],
      [''],
      ['Cell Count (cells/ml)', ''],
      ...classNames.map((name, idx) => {
        const classKey = name.replace(' ', '_');
        return [name, cellCountMap[classKey]?.toLocaleString() || 'N/A'];
      }),
      ['Predicted Cell Count', cellCountMap[classNames[results.predicted_class].replace(' ', '_')]?.toLocaleString() || 'N/A']
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lfa_classification_report_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [results]);

  const startTraining = useCallback(() => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);

    trainingIntervalRef.current = setInterval(() => {
      setTrainingProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(trainingIntervalRef.current);
          setIsTraining(false);
          setTrainingLogs(prev => [...prev, "Training completed successfully!"]);
          return 100;
        }

        const epoch = Math.floor(newProgress / 10) + 1;
        const logMessages = [
          `Epoch ${epoch}: Training loss: ${(Math.random() * 0.5 + 0.1).toFixed(4)}`,
          `Epoch ${epoch}: Validation accuracy: ${(Math.random() * 20 + 70).toFixed(2)}%`,
          `Epoch ${epoch}: Learning rate adjusted to ${(Math.random() * 0.001).toFixed(6)}`,
          `Epoch ${epoch}: Early stopping patience: ${Math.floor(Math.random() * 7) + 1}/7`
        ];

        setTrainingLogs(prev => [...prev, logMessages[Math.floor(Math.random() * logMessages.length)]]);

        return newProgress;
      });
    }, 500);
  }, []);

  const stopTraining = useCallback(() => {
    if (trainingIntervalRef.current) {
      clearInterval(trainingIntervalRef.current);
    }
    setIsTraining(false);
    setTrainingLogs(prev => [...prev, "Training stopped by user."]);
  }, []);

  const resetTraining = useCallback(() => {
    setTrainingProgress(0);
    setTrainingLogs([]);
  }, []);

  const CollapsibleSection = ({ title, isOpen, onToggle, children, bgColor = "bg-gray-50" }) => (
    <div className={`${bgColor} rounded-lg border`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 rounded-lg transition-colors"
      >
        <h4 className="font-semibold">{title}</h4>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );

  const renderUploadTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Upload className="mr-2" size={20} />
          Upload Image
        </h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Click to upload or drag and drop an LFA test image
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Choose File
          </button>
        </div>
      </div>

      {imagePreview && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Image Preview</h3>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <img
                  src={croppedImage || imagePreview}
                  alt="Preview"
                  className="w-full max-w-md rounded-lg border"
                />
                {!showCropper && (
                  <div className="absolute top-2 right-2 space-x-2">
                    <button
                      onClick={() => setShowCropper(true)}
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                      title="Crop Image"
                    >
                      <Crop size={16} />
                    </button>
                    {croppedImage && (
                      <button
                        onClick={resetCrop}
                        className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
                        title="Reset Crop"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="space-y-4">
                <button
                  onClick={simulateClassification}
                  disabled={isProcessing}
                  className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2" size={20} />
                      Classify Image
                    </>
                  )}
                </button>

                {results && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={downloadReport}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <Download className="mr-2" size={16} />
                        Download Report (CSV)
                      </button>
                    </div>

                    {/* Classification Results */}
                    <CollapsibleSection
                      title="Classification Results"
                      isOpen={showClassification}
                      onToggle={() => setShowClassification(!showClassification)}
                      bgColor="bg-blue-50"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Predicted Class:</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {classNames[results.predicted_class]}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium mb-2 block">Confidence Scores:</span>
                          <div className="space-y-2">
                            {results.confidence_scores.map((score, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-sm min-w-24">{classNames[index]}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${score * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-mono min-w-12">
                                  {(score * 100).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 pt-2 border-t">
                          <p>Model: {results.model_used}</p>
                          <p>Model Path: {modelPath}</p>
                          <p>Image Type: {results.image_type}</p>
                          <p>Preprocessing: {results.preprocessing_applied ? 'Applied' : 'Not Applied'}</p>
                        </div>
                      </div>
                    </CollapsibleSection>

                    {/* Bacterial Count */}
                    <CollapsibleSection
                      title="Bacterial Count (CFU/ml)"
                      isOpen={showBacterialCount}
                      onToggle={() => setShowBacterialCount(!showBacterialCount)}
                      bgColor="bg-green-50"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Predicted Bacterial Count:</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-mono">
                            {bacterialCountMap[classNames[results.predicted_class].replace(' ', '_')].toLocaleString()} CFU/ml
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium mb-2 block">Count Distribution:</span>
                          <div className="space-y-2">
                            {results.confidence_scores.map((score, index) => {
                              const classKey = classNames[index].replace(' ', '_');
                              const count = bacterialCountMap[classKey];
                              return (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-sm min-w-24">{classNames[index]}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${score * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-mono min-w-20">
                                    {count.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CollapsibleSection>

                    {/* Cell Count */}
                    <CollapsibleSection
                      title="Cell Count (cells/ml)"
                      isOpen={showCellCount}
                      onToggle={() => setShowCellCount(!showCellCount)}
                      bgColor="bg-purple-50"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Predicted Cell Count:</span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono">
                            {cellCountMap[classNames[results.predicted_class].replace(' ', '_')].toLocaleString()} cells/ml
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium mb-2 block">Count Distribution:</span>
                          <div className="space-y-2">
                            {results.confidence_scores.map((score, index) => {
                              const classKey = classNames[index].replace(' ', '_');
                              const count = cellCountMap[classKey];
                              return (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-sm min-w-24">{classNames[index]}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-purple-500 h-2 rounded-full"
                                      style={{ width: `${score * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-mono min-w-20">
                                    {count.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CollapsibleSection>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCropper && imagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Crop Image</h3>
            
            <div className="mb-4">
              <img
                ref={cropImageRef}
                src={imagePreview}
                alt="Crop source"
                className="hidden"
                onLoad={() => {
                  if (cropCanvasRef.current && cropImageRef.current) {
                    const canvas = cropCanvasRef.current;
                    const img = cropImageRef.current;
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    drawCropCanvas();
                  }
                }}
              />
              
              <canvas
                ref={cropCanvasRef}
                className="border rounded-lg cursor-crosshair max-w-full max-h-96"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCropper(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
              >
                <X className="mr-2" size={16} />
                Cancel
              </button>
              <button
                onClick={applyCrop}
                disabled={!cropSelection || cropSelection.width === 0 || cropSelection.height === 0}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Check className="mr-2" size={16} />
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTrainingTab = () => (
    <div className="space-y-6">
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4 flex items-center">
      <Settings className="mr-2" size={20} />
      Model Configuration
    </h2>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Model Path</label>
      <div className="bg-gray-100 p-3 rounded-lg border">
        <code className="text-sm text-gray-700">{modelPath}</code>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Model Type</label>
        <select
          value={modelSettings.model_type}
          onChange={(e) =>
            setModelSettings({ ...modelSettings, model_type: e.target.value })
          }
          className="w-full p-2 border rounded-lg"
        >
          <option value="efficientnet_b0">EfficientNet B0</option>
          <option value="efficientnet_b1">EfficientNet B1</option>
          <option value="resnet50">ResNet-50</option>
          <option value="mobilenet_v2">MobileNet V2</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Learning Rate</label>
        <input
          type="number"
          value={modelSettings.learning_rate}
          onChange={(e) =>
            setModelSettings({
              ...modelSettings,
              learning_rate: parseFloat(e.target.value),
            })
          }
          step="0.0001"
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Batch Size</label>
        <input
          type="number"
          value={modelSettings.batch_size}
          onChange={(e) =>
            setModelSettings({
              ...modelSettings,
              batch_size: parseInt(e.target.value),
            })
          }
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Epochs</label>
        <input
          type="number"
          value={modelSettings.num_epochs}
          onChange={(e) =>
            setModelSettings({
              ...modelSettings,
              num_epochs: parseInt(e.target.value),
            })
          }
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Dropout Rate</label>
        <input
          type="number"
          value={modelSettings.dropout_rate}
          onChange={(e) =>
            setModelSettings({
              ...modelSettings,
              dropout_rate: parseFloat(e.target.value),
            })
          }
          step="0.1"
          min="0"
          max="1"
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Weight Decay</label>
        <input
          type="number"
          value={modelSettings.weight_decay}
          onChange={(e) =>
            setModelSettings({
              ...modelSettings,
              weight_decay: parseFloat(e.target.value),
            })
          }
          step="0.01"
          className="w-full p-2 border rounded-lg"
        />
      </div>
    </div>
  </div>

  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold mb-4">Training Control</h3>

    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={startTraining}
        disabled={isTraining}
        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
      >
        <Play className="mr-2" size={16} />
        Start Training
      </button>

      <button
        onClick={stopTraining}
        disabled={!isTraining}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
      >
        <Pause className="mr-2" size={16} />
        Stop Training
      </button>

      <button
        onClick={resetTraining}
        disabled={isTraining}
        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
      >
        <RefreshCw className="mr-2" size={16} />
        Reset Training
      </button>
    </div>

    {/* You can add training progress bar / logs here */}
  </div>
</div>
  )} 
import React from 'react';
import LFAClassifierApp from './components/LFAClassifierApp';

function App() {
  return <LFAClassifierApp />;
}

export default App;