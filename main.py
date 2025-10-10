import os

# Get port from environment variable (Railway sets this)
PORT = int(os.getenv("PORT", 8000))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.cluster import KMeans
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import mean_squared_error, accuracy_score, confusion_matrix
import json

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sketchml.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Point(BaseModel):
    x: float
    y: float
    label: Optional[int] = None

class TrainingData(BaseModel):
    points: List[Point]
    algorithm: str
    params: Dict[str, Any]

class TestPoint(BaseModel):
    x: float
    y: float

# Algorithm implementations
class MLAlgorithms:
    @staticmethod
    def linear_regression(data: List[Point], params: Dict):
        if len(data) < 2:
            return None
        
        X = np.array([[p.x] for p in data])
        y = np.array([p.y for p in data])
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Generate line points
        x_range = np.linspace(X.min() - 1, X.max() + 1, 100)
        y_pred = model.predict(x_range.reshape(-1, 1))
        
        # Calculate metrics
        train_pred = model.predict(X)
        mse = mean_squared_error(y, train_pred)
        
        return {
            "model": model,
            "visualization": {
                "line": [{"x": float(x), "y": float(y)} for x, y in zip(x_range, y_pred)]
            },
            "parameters": {
                "slope": float(model.coef_[0]),
                "intercept": float(model.intercept_)
            },
            "metrics": {
                "mse": float(mse),
                "r_squared": float(model.score(X, y))
            }
        }
    
    @staticmethod
    def logistic_regression(data: List[Point], params: Dict):
        if len(data) < 2:
            return None
        
        X = np.array([[p.x, p.y] for p in data])
        y = np.array([p.label for p in data])
        
        if len(np.unique(y)) < 2:
            return None
        
        C = params.get("C", 1.0)
        model = LogisticRegression(C=C, max_iter=1000)
        model.fit(X, y)
        
        # Generate decision boundary
        x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
        y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
        xx, yy = np.meshgrid(np.linspace(x_min, x_max, 50),
                             np.linspace(y_min, y_max, 50))
        Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)
        
        # Calculate metrics
        train_pred = model.predict(X)
        acc = accuracy_score(y, train_pred)
        cm = confusion_matrix(y, train_pred)
        
        return {
            "model": model,
            "visualization": {
                "decision_boundary": {
                    "x": xx.tolist(),
                    "y": yy.tolist(),
                    "z": Z.tolist()
                }
            },
            "parameters": {
                "weights": model.coef_.tolist(),
                "intercept": model.intercept_.tolist(),
                "C": C
            },
            "metrics": {
                "accuracy": float(acc),
                "confusion_matrix": cm.tolist()
            }
        }
    
    @staticmethod
    def kmeans(data: List[Point], params: Dict):
        if len(data) < 1:
            return None
        
        X = np.array([[p.x, p.y] for p in data])
        n_clusters = params.get("n_clusters", 3)
        n_clusters = min(n_clusters, len(data))
        
        model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = model.fit_predict(X)
        
        # Calculate inertia
        inertia = model.inertia_
        
        return {
            "model": model,
            "visualization": {
                "centers": [{"x": float(c[0]), "y": float(c[1])} for c in model.cluster_centers_],
                "labels": labels.tolist()
            },
            "parameters": {
                "n_clusters": n_clusters
            },
            "metrics": {
                "inertia": float(inertia)
            }
        }
    
    @staticmethod
    def svm(data: List[Point], params: Dict):
        if len(data) < 2:
            return None
        
        X = np.array([[p.x, p.y] for p in data])
        y = np.array([p.label for p in data])
        
        if len(np.unique(y)) < 2:
            return None
        
        C = params.get("C", 1.0)
        kernel = params.get("kernel", "rbf")
        gamma = params.get("gamma", "scale")
        
        model = SVC(C=C, kernel=kernel, gamma=gamma)
        model.fit(X, y)
        
        # Generate decision boundary
        x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
        y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
        xx, yy = np.meshgrid(np.linspace(x_min, x_max, 50),
                             np.linspace(y_min, y_max, 50))
        Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)
        
        # Calculate metrics
        train_pred = model.predict(X)
        acc = accuracy_score(y, train_pred)
        cm = confusion_matrix(y, train_pred)
        
        return {
            "model": model,
            "visualization": {
                "decision_boundary": {
                    "x": xx.tolist(),
                    "y": yy.tolist(),
                    "z": Z.tolist()
                },
                "support_vectors": model.support_vectors_.tolist()
            },
            "parameters": {
                "C": C,
                "kernel": kernel,
                "gamma": str(gamma),
                "n_support": model.n_support_.tolist()
            },
            "metrics": {
                "accuracy": float(acc),
                "confusion_matrix": cm.tolist()
            }
        }
    
    @staticmethod
    def naive_bayes(data: List[Point], params: Dict):
        if len(data) < 2:
            return None
        
        X = np.array([[p.x, p.y] for p in data])
        y = np.array([p.label for p in data])
        
        if len(np.unique(y)) < 2:
            return None
        
        model = GaussianNB()
        model.fit(X, y)
        
        # Generate decision boundary
        x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
        y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
        xx, yy = np.meshgrid(np.linspace(x_min, x_max, 50),
                             np.linspace(y_min, y_max, 50))
        Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)
        
        # Calculate metrics
        train_pred = model.predict(X)
        acc = accuracy_score(y, train_pred)
        cm = confusion_matrix(y, train_pred)
        
        return {
            "model": model,
            "visualization": {
                "decision_boundary": {
                    "x": xx.tolist(),
                    "y": yy.tolist(),
                    "z": Z.tolist()
                }
            },
            "parameters": {
                "theta": model.theta_.tolist(),
                "var": model.var_.tolist()
            },
            "metrics": {
                "accuracy": float(acc),
                "confusion_matrix": cm.tolist()
            }
        }
    
    @staticmethod
    def random_forest(data: List[Point], params: Dict):
        if len(data) < 2:
            return None
        
        X = np.array([[p.x, p.y] for p in data])
        y = np.array([p.label for p in data])
        
        if len(np.unique(y)) < 2:
            return None
        
        n_estimators = params.get("n_estimators", 100)
        max_depth = params.get("max_depth", None)
        
        model = RandomForestClassifier(
            n_estimators=n_estimators, 
            max_depth=max_depth,
            random_state=42
        )
        model.fit(X, y)
        
        # Generate decision boundary
        x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
        y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
        xx, yy = np.meshgrid(np.linspace(x_min, x_max, 50),
                             np.linspace(y_min, y_max, 50))
        Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)
        
        # Calculate metrics
        train_pred = model.predict(X)
        acc = accuracy_score(y, train_pred)
        cm = confusion_matrix(y, train_pred)
        
        return {
            "model": model,
            "visualization": {
                "decision_boundary": {
                    "x": xx.tolist(),
                    "y": yy.tolist(),
                    "z": Z.tolist()
                }
            },
            "parameters": {
                "n_estimators": n_estimators,
                "max_depth": max_depth if max_depth else "None",
                "feature_importances": model.feature_importances_.tolist()
            },
            "metrics": {
                "accuracy": float(acc),
                "confusion_matrix": cm.tolist()
            }
        }
    
    @staticmethod
    def knn(data: List[Point], params: Dict):
        if len(data) < 2:
            return None
        
        X = np.array([[p.x, p.y] for p in data])
        y = np.array([p.label for p in data])
        
        if len(np.unique(y)) < 2:
            return None
        
        n_neighbors = params.get("n_neighbors", 5)
        n_neighbors = min(n_neighbors, len(data))
        
        model = KNeighborsClassifier(n_neighbors=n_neighbors)
        model.fit(X, y)
        
        # Generate decision boundary
        x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
        y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
        xx, yy = np.meshgrid(np.linspace(x_min, x_max, 50),
                             np.linspace(y_min, y_max, 50))
        Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)
        
        # Calculate metrics
        train_pred = model.predict(X)
        acc = accuracy_score(y, train_pred)
        cm = confusion_matrix(y, train_pred)
        
        return {
            "model": model,
            "visualization": {
                "decision_boundary": {
                    "x": xx.tolist(),
                    "y": yy.tolist(),
                    "z": Z.tolist()
                }
            },
            "parameters": {
                "n_neighbors": n_neighbors
            },
            "metrics": {
                "accuracy": float(acc),
                "confusion_matrix": cm.tolist()
            }
        }

# Global state for trained models
trained_models = {}

def retrain_model(data: TrainingData, connection_id: str):
    algorithm_map = {
        "linear_regression": MLAlgorithms.linear_regression,
        "logistic_regression": MLAlgorithms.logistic_regression,
        "kmeans": MLAlgorithms.kmeans,
        "svm": MLAlgorithms.svm,
        "naive_bayes": MLAlgorithms.naive_bayes,
        "random_forest": MLAlgorithms.random_forest,
        "knn": MLAlgorithms.knn
    }
    
    if data.algorithm not in algorithm_map:
        return {"error": "Unknown algorithm"}
    
    result = algorithm_map[data.algorithm](data.points, data.params)
    
    if result is None:
        return {"error": "Insufficient data"}
    
    # Store the trained model
    trained_models[connection_id] = result["model"]
    
    # Remove model from response (not JSON serializable)
    del result["model"]
    
    return result

# WebSocket endpoint
@app.websocket("/ws/{connection_id}")
async def websocket_endpoint(websocket: WebSocket, connection_id: str):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            training_data = TrainingData(**json.loads(data))
            
            result = retrain_model(training_data, connection_id)
            
            await websocket.send_json(result)
    
    except WebSocketDisconnect:
        if connection_id in trained_models:
            del trained_models[connection_id]

# REST endpoint for predictions
@app.post("/predict/{connection_id}")
async def predict(connection_id: str, test_point: TestPoint):
    if connection_id not in trained_models:
        return {"error": "No trained model found"}
    
    model = trained_models[connection_id]
    
    try:
        # Check if it's a regression or classification model
        if hasattr(model, 'predict'):
            if isinstance(model, LinearRegression):
                prediction = model.predict([[test_point.x]])
                return {"prediction": float(prediction[0])}
            else:
                prediction = model.predict([[test_point.x, test_point.y]])
                return {"prediction": int(prediction[0])}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "SKETCHML Backend API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)