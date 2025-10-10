import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ALGORITHMS = {
  linear_regression: { name: 'Linear Regression', type: 'regression' },
  logistic_regression: { name: 'Logistic Regression', type: 'classification' },
  naive_bayes: { name: 'Naive Bayes', type: 'classification' },
  knn: { name: 'K-Nearest Neighbors', type: 'classification' },
  svm: { name: 'Support Vector Machine', type: 'classification' },
  random_forest: { name: 'Random Forest', type: 'classification' },
  kmeans: { name: 'K-Means Clustering', type: 'clustering' }
};

export default function SketchML() {
  const [points, setPoints] = useState([]);
  const [algorithm, setAlgorithm] = useState('linear_regression');
  const [params, setParams] = useState({ 
    C: 1.0, 
    n_clusters: 3, 
    kernel: 'rbf', 
    gamma: 'scale',
    n_neighbors: 5,
    n_estimators: 100,
    max_depth: null
  });
  const [modelData, setModelData] = useState(null);
  const [currentLabel, setCurrentLabel] = useState(0);
  const [testPoint, setTestPoint] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const svgRef = useRef();
  const wsRef = useRef(null);
  const connectionId = useRef(`conn_${Date.now()}`);

  // Backend URLs - Production vs Development
  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'sketchml.vercel.app') {
      return 'https://sketchml-production.up.railway.app';
    }
    return 'http://localhost:8000';
  };

  const getWsUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'sketchml.vercel.app') {
      return 'wss://sketchml-production.up.railway.app';
    }
    return 'ws://localhost:8000';
  };

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`${getWsUrl()}/ws/${connectionId.current}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.error) {
        setModelData(data);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };
    
    wsRef.current = ws;
    
    return () => ws.close();
  }, []);

  // Send training data to backend
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && points.length > 0) {
      wsRef.current.send(JSON.stringify({
        points,
        algorithm,
        params
      }));
    }
  }, [points, algorithm, params]);

  // D3 Visualization
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const xScale = d3.scaleLinear()
      .domain([-10, 10])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-10, 10])
      .range([height - margin.bottom, margin.top]);

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#1a1a2e');

    // Decision boundary for classification
    if (modelData && modelData.visualization && modelData.visualization.decision_boundary) {
      const db = modelData.visualization.decision_boundary;
      const contours = [];
      
      for (let i = 0; i < db.z.length; i++) {
        for (let j = 0; j < db.z[i].length; j++) {
          contours.push({
            x: db.x[i][j],
            y: db.y[i][j],
            z: db.z[i][j]
          });
        }
      }

      svg.selectAll('.boundary-cell')
        .data(contours)
        .enter()
        .append('rect')
        .attr('class', 'boundary-cell')
        .attr('x', d => xScale(d.x) - 6)
        .attr('y', d => yScale(d.y) - 5)
        .attr('width', 12)
        .attr('height', 10)
        .attr('fill', d => d.z === 0 ? 'rgba(100, 150, 255, 0.2)' : 'rgba(255, 100, 150, 0.2)')
        .attr('stroke', 'none');
    }

    // Grid
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(10));
    
    xAxis.selectAll('line').attr('stroke', '#666');
    xAxis.selectAll('path').attr('stroke', '#666');
    xAxis.selectAll('text').attr('fill', '#fff').attr('font-size', '12px');

    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(10));
    
    yAxis.selectAll('line').attr('stroke', '#666');
    yAxis.selectAll('path').attr('stroke', '#666');
    yAxis.selectAll('text').attr('fill', '#fff').attr('font-size', '12px');

    // Regression line
    if (modelData && modelData.visualization && modelData.visualization.line) {
      const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

      svg.append('path')
        .datum(modelData.visualization.line)
        .attr('fill', 'none')
        .attr('stroke', '#00ff88')
        .attr('stroke-width', 3)
        .attr('d', line);
    }

    // K-Means centers
    if (modelData && modelData.visualization && modelData.visualization.centers) {
      svg.selectAll('.cluster-center')
        .data(modelData.visualization.centers)
        .enter()
        .append('circle')
        .attr('class', 'cluster-center')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 12)
        .attr('fill', 'none')
        .attr('stroke', '#ffaa00')
        .attr('stroke-width', 3);

      svg.selectAll('.cluster-center-dot')
        .data(modelData.visualization.centers)
        .enter()
        .append('circle')
        .attr('class', 'cluster-center-dot')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 4)
        .attr('fill', '#ffaa00');
    }

    // Support vectors
    if (modelData && modelData.visualization && modelData.visualization.support_vectors) {
      svg.selectAll('.support-vector-ring')
        .data(modelData.visualization.support_vectors)
        .enter()
        .append('circle')
        .attr('class', 'support-vector-ring')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => yScale(d[1]))
        .attr('r', 10)
        .attr('fill', 'none')
        .attr('stroke', '#ffff00')
        .attr('stroke-width', 2);
    }

    // Data points with cluster colors
    const colorScale = d3.scaleOrdinal()
      .domain([0, 1, 2, 3, 4])
      .range(['#6496ff', '#ff6464', '#64ff64', '#ffaa64', '#aa64ff']);

    svg.selectAll('.data-point')
      .data(points)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 6)
      .attr('fill', (d, i) => {
        if (ALGORITHMS[algorithm].type === 'classification') {
          return colorScale(d.label);
        } else if (modelData && modelData.visualization && modelData.visualization.labels) {
          return colorScale(modelData.visualization.labels[i]);
        }
        return '#00ff88';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation();
        setPoints(pts => pts.filter(p => p !== d));
      });

    // Test point
    if (testPoint) {
      svg.append('circle')
        .attr('cx', xScale(testPoint.x))
        .attr('cy', yScale(testPoint.y))
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', '#ffff00')
        .attr('stroke-width', 3);
      
      svg.append('circle')
        .attr('cx', xScale(testPoint.x))
        .attr('cy', yScale(testPoint.y))
        .attr('r', 4)
        .attr('fill', '#ffff00');
    }

    // Click to add points or set test point
    svg.on('click', function(event) {
      const [mouseX, mouseY] = d3.pointer(event);
      const x = xScale.invert(mouseX);
      const y = yScale.invert(mouseY);
      
      if (x >= -10 && x <= 10 && y >= -10 && y <= 10) {
        if (event.shiftKey) {
          // Shift+Click sets test point
          setTestPoint({ x, y });
        } else {
          // Regular click adds training point
          const newPoint = { x, y };
          if (ALGORITHMS[algorithm].type === 'classification') {
            newPoint.label = currentLabel;
          }
          setPoints(prev => [...prev, newPoint]);
        }
      }
    });

  }, [points, modelData, algorithm, currentLabel, testPoint]);

  const handleTestPointClick = async () => {
    if (!testPoint) return;
    
    try {
      const response = await fetch(`${getBackendUrl()}/predict/${connectionId.current}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPoint)
      });
      const data = await response.json();
      setPrediction(data.prediction);
    } catch (error) {
      console.error('Prediction error:', error);
    }
  };

  useEffect(() => {
    if (testPoint) {
      handleTestPointClick();
    }
  }, [testPoint]);

  const clearPoints = () => {
    setPoints([]);
    setModelData(null);
    setTestPoint(null);
    setPrediction(null);
  };

  const algorithmType = ALGORITHMS[algorithm].type;

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Left Panel - Visualization */}
      <div style={{ flex: 2, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '700', background: 'linear-gradient(90deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SKETCHML
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
            Interactive Machine Learning Visualization
          </p>
        </div>

        {/* Canvas */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '12px', 
          padding: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <svg ref={svgRef} width="600" height="500" style={{ display: 'block' }} />
          <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#888' }}>
            Click to add points • Click points to remove
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button 
            onClick={clearPoints}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 100, 100, 0.2)',
              border: '1px solid rgba(255, 100, 100, 0.5)',
              borderRadius: '8px',
              color: '#ff6464',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Clear All
          </button>
          
          <div style={{
            padding: '8px 16px',
            background: isConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 100, 100, 0.2)',
            border: `1px solid ${isConnected ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 100, 100, 0.5)'}`,
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#00ff88' : '#ff6464'
            }} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Right Panel - Controls */}
      <div style={{ 
        flex: 1, 
        padding: '30px', 
        background: 'rgba(0, 0, 0, 0.3)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>Algorithm</h2>
        
        <select 
          value={algorithm}
          onChange={(e) => {
            setAlgorithm(e.target.value);
            setPoints([]);
            setModelData(null);
          }}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            marginBottom: '30px',
            cursor: 'pointer'
          }}
        >
          {Object.entries(ALGORITHMS).map(([key, val]) => (
            <option key={key} value={key} style={{ background: '#1a1a2e' }}>
              {val.name}
            </option>
          ))}
        </select>

        {/* Classification label selector */}
        {algorithmType === 'classification' && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Class Label</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[0, 1].map(label => (
                <button
                  key={label}
                  onClick={() => setCurrentLabel(label)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: currentLabel === label ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    border: `2px solid ${currentLabel === label ? '#00ff88' : 'rgba(255, 255, 255, 0.2)'}`,
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Class {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Parameters */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Parameters</h3>
          
          {algorithm === 'kmeans' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>
                Clusters: {params.n_clusters}
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={params.n_clusters}
                onChange={(e) => setParams({...params, n_clusters: parseInt(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {(algorithm === 'logistic_regression' || algorithm === 'svm') && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>
                C (Regularization): {params.C}
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={params.C}
                onChange={(e) => setParams({...params, C: parseFloat(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {algorithm === 'svm' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>
                Kernel
              </label>
              <select
                value={params.kernel}
                onChange={(e) => setParams({...params, kernel: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="linear" style={{ background: '#1a1a2e' }}>Linear</option>
                <option value="rbf" style={{ background: '#1a1a2e' }}>RBF</option>
                <option value="poly" style={{ background: '#1a1a2e' }}>Polynomial</option>
              </select>
            </div>
          )}

          {algorithm === 'knn' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>
                Neighbors (K): {params.n_neighbors}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={params.n_neighbors}
                onChange={(e) => setParams({...params, n_neighbors: parseInt(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {algorithm === 'random_forest' && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>
                  Trees (n_estimators): {params.n_estimators}
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={params.n_estimators}
                  onChange={(e) => setParams({...params, n_estimators: parseInt(e.target.value)})}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>
                  Max Depth: {params.max_depth || 'None'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={params.max_depth || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setParams({...params, max_depth: val === 0 ? null : val});
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
        </div>

        {/* Model Parameters */}
        {modelData && modelData.parameters && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Model Parameters</h3>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'monospace'
            }}>
              {Object.entries(modelData.parameters).map(([key, val]) => (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#00ccff' }}>{key}:</span>{' '}
                  <span style={{ color: '#00ff88' }}>
                    {typeof val === 'number' ? val.toFixed(4) : JSON.stringify(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        {modelData && modelData.metrics && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Metrics</h3>
            <div style={{
              background: 'rgba(0, 255, 136, 0.1)',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 136, 0.3)'
            }}>
              {Object.entries(modelData.metrics).map(([key, val]) => (
                <div key={key} style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: '#aaa', textTransform: 'uppercase', fontSize: '12px' }}>
                    {key.replace('_', ' ')}:
                  </span>{' '}
                  <span style={{ color: '#00ff88', fontWeight: '600' }}>
                    {typeof val === 'number' ? val.toFixed(4) : JSON.stringify(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testing Panel */}
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Test Point</h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#aaa' }}>
            Click on canvas with Shift key to set test point
          </p>
          
          {testPoint && (
            <div style={{
              background: 'rgba(255, 255, 0, 0.1)',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 0, 0.3)'
            }}>
              <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#aaa' }}>Position:</span>{' '}
                <span style={{ color: '#fff' }}>
                  ({testPoint.x.toFixed(2)}, {testPoint.y.toFixed(2)})
                </span>
              </div>
              {prediction !== null && (
                <div style={{ fontSize: '14px' }}>
                  <span style={{ color: '#aaa' }}>Prediction:</span>{' '}
                  <span style={{ color: '#ffff00', fontWeight: '600', fontSize: '16px' }}>
                    {typeof prediction === 'number' && prediction % 1 !== 0 
                      ? prediction.toFixed(4)
                      : prediction}
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  setTestPoint(null);
                  setPrediction(null);
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Clear Test Point
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', fontSize: '12px', color: '#888' }}>
          <p style={{ margin: '0 0 8px 0' }}><strong style={{ color: '#00ff88' }}>Instructions:</strong></p>
          <p style={{ margin: '0 0 5px 0' }}>• Click canvas to add training points</p>
          <p style={{ margin: '0 0 5px 0' }}>• Click points to remove them</p>
          <p style={{ margin: '0 0 5px 0' }}>• Shift+Click to set test point</p>
          <p style={{ margin: 0 }}>• Adjust parameters in real-time</p>
        </div>
      </div>
    </div>
  );
}