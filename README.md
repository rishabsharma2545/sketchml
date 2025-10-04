# SKETCHML 🎨🤖

An interactive educational website designed to help students and enthusiasts intuitively understand core Supervised and Unsupervised Machine Learning algorithms using two-dimensional vector data.

![SKETCHML Demo](demo.gif)

## Features

- 🎯 **Interactive Visualization**: Click to add training points, drag to modify, real-time model updates
- 🧠 **7 ML Algorithms**: 
  - Linear Regression
  - Logistic Regression
  - Naive Bayes
  - K-Nearest Neighbors (KNN)
  - Support Vector Machines (SVM)
  - Random Forest
  - K-Means Clustering
- ⚡ **Real-time Training**: WebSocket-based instant feedback as you modify data
- 🎛️ **Adjustable Parameters**: Sliders to tune hyperparameters and see effects immediately
- 📊 **Live Metrics**: View accuracy, loss, confusion matrices, and model parameters
- 🧪 **Test Mode**: Shift+Click to test predictions on new points

## Demo

Try it live: [Your deployed URL here]

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sketchml.git
cd sketchml
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Run the backend server:
```bash
python main.py
```

The backend will start on `http://localhost:8000`

### Frontend Setup

1. Install Node dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

## Usage

### Basic Usage

1. **Select an algorithm** from the dropdown menu
2. **Choose a class label** (for classification algorithms)
3. **Click on the canvas** to add training points
4. **Watch the model train** in real-time and see decision boundaries
5. **Adjust parameters** using sliders to see how they affect the model
6. **Shift+Click** to set a test point and see predictions

### Algorithm-Specific Tips

- **Linear Regression**: Great for showing linear relationships
- **Logistic Regression**: Adjust C parameter to see regularization effects
- **SVM**: Try different kernels (linear, RBF, polynomial)
- **Random Forest**: Increase trees to see smoother boundaries
- **KNN**: Low K = noisy boundaries, High K = smoother boundaries
- **K-Means**: Adjust number of clusters to see different groupings

## Project Structure

```
sketchml/
├── main.py                 # FastAPI backend with ML algorithms
├── requirements.txt        # Python dependencies
├── package.json           # Node dependencies
├── vite.config.js         # Vite configuration
├── index.html             # HTML entry point
└── src/
    ├── main.jsx           # React entry point
    └── App.jsx            # Main React component with D3 visualization
```

## Technologies Used

### Backend
- **FastAPI**: High-performance web framework
- **WebSockets**: Real-time bidirectional communication
- **Scikit-learn**: Machine learning algorithms
- **NumPy**: Numerical computations

### Frontend
- **React**: UI framework
- **D3.js**: Data visualization
- **Vite**: Build tool and dev server

## API Documentation

### WebSocket Endpoint

```
WS /ws/{connection_id}
```

Send training data and receive model results in real-time.

**Request Format:**
```json
{
  "points": [{"x": 1.5, "y": 2.3, "label": 0}],
  "algorithm": "svm",
  "params": {"C": 1.0, "kernel": "rbf"}
}
```

**Response Format:**
```json
{
  "visualization": { ... },
  "parameters": { ... },
  "metrics": { ... }
}
```

### REST Endpoint

```
POST /predict/{connection_id}
```

Get predictions for test points.

## Deployment

### Deploy to Render/Railway/Heroku

1. **Backend**: Deploy the Python app using the `main.py` file
2. **Frontend**: Build and deploy the static files

```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Environment Variables

For production, update WebSocket URL in `src/App.jsx`:
```javascript
const ws = new WebSocket(`wss://your-backend-domain.com/ws/${connectionId.current}`);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Add more algorithms (Decision Trees, Neural Networks)
- [ ] Support for 3D visualization
- [ ] Export trained models
- [ ] Save/load datasets
- [ ] Mobile-responsive design
- [ ] Tutorial mode with guided examples
- [ ] Performance benchmarking tools

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by educational ML visualization tools
- Built with ❤️ for students and ML enthusiasts
- Special thanks to the Scikit-learn and D3.js communities

## Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/sketchml](https://github.com/yourusername/sketchml)

---

⭐ Star this repo if you find it helpful!