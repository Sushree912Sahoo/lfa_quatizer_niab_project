// @ts-nocheck
import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Camera, Play, BarChart3, Database,
  Download, FileText, Microscope, Droplets, Activity
} from 'lucide-react';

const LFAAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('classification');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('classify');
  const [comments, setComments] = useState({
    trueClass: '',
    trueBacterialCount: '',
    trueCellCount: ''
  });
  const [csvData, setCsvData] = useState([]);
  const [trainingDataset, setTrainingDataset] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const trainingDataRef = useRef(null);

  const concentrationData = {
    '1_Microgram': { bacterialCount: 1000000, cellCount: 12000, unit: 'cfu/ml' },
    '100_Nanogram': { bacterialCount: 100000, cellCount: 10000, unit: 'cfu/ml' },
    '10_Nanogram': { bacterialCount: 10000, cellCount: 8000, unit: 'cfu/ml' },
    '1_Nanogram': { bacterialCount: 1000, cellCount: 6000, unit: 'cfu/ml' }
  };

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage({ file, preview: e.target.result, name: file.name });
        setPredictions(null);
        setComments({ trueClass: '', trueBacterialCount: '', trueCellCount: '' });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCameraCapture = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage({
          file,
          preview: e.target.result,
          name: `camera_${Date.now()}.jpg`
        });
        setPredictions(null);
        setComments({ trueClass: '', trueBacterialCount: '', trueCellCount: '' });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!uploadedImage) return;
    setIsAnalyzing(true);

    // Simulate API call
    setTimeout(() => {
      const mockPredictions = {
        predictedClass: '100_Nanogram',
        confidence: 0.87,
        probabilities: {
          '1_Microgram': 0.05,
          '100_Nanogram': 0.87,
          '10_Nanogram': 0.06,
          '1_Nanogram': 0.02
        },
        modelPath: 'C:\Users\RUTUDHWAJA\PROJECT_NIAB\React\lfa-classifier\public\anti_overfitting_model.pth'
      };
      setPredictions(mockPredictions);
      setIsAnalyzing(false);
    }, 2000);
  }, [uploadedImage]);

  const handleTrainingDataUpload = useCallback((event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setTrainingDataset({ files: Array.from(files), count: files.length });
    }
  }, []);

  const startTraining = useCallback(() => {
    if (!trainingDataset) return;
    setIsTraining(true);
    setTrainingProgress(0);
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  }, [trainingDataset]);

  const addToCSV = useCallback(() => {
    if (!predictions || !uploadedImage) return;
    const newEntry = {
      imageName: uploadedImage.name,
      trueClass: comments.trueClass,
      predictedClass: predictions.predictedClass,
      confidenceScore: predictions.confidence,
      isCorrect: comments.trueClass === predictions.predictedClass,
      '1_Microgram_probability': predictions.probabilities['1_Microgram'],
      '100_Nanogram_probability': predictions.probabilities['100_Nanogram'],
      '10_Nanogram_probability': predictions.probabilities['10_Nanogram'],
      '1_Nanogram_probability': predictions.probabilities['1_Nanogram'],
      timestamp: new Date().toISOString()
    };
    setCsvData((prev) => [...prev, newEntry]);
    setUploadedImage(null);
    setPredictions(null);
    setComments({ trueClass: '', trueBacterialCount: '', trueCellCount: '' });
  }, [predictions, uploadedImage, comments]);

  const downloadCSV = useCallback(() => {
    if (csvData.length === 0) return;
    const headers = [
      'Image Name', 'True Class', 'Predicted Class', 'Confidence Score',
      'Is Correct', '1_Microgram Probability', '100_Nanogram Probability',
      '10_Nanogram Probability', '1_Nanogram Probability', 'Timestamp'
    ];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => [
        row.imageName,
        row.trueClass,
        row.predictedClass,
        row.confidenceScore,
        row.isCorrect,
        row['1_Microgram_probability'],
        row['100_Nanogram_probability'],
        row['10_Nanogram_probability'],
        row['1_Nanogram_probability'],
        row.timestamp
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lfa_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [csvData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Main UI remains unchanged */}
      {/* Keep using correct `className={`...`}` for dynamic classes and ensure template literals use backticks */}
    </div>
  );
};

export default LFAAnalyzer;
