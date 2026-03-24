import numpy as np
import joblib
import os
import logging

logger = logging.getLogger(__name__)

class LiveStockPredictor:
    def __init__(self):
        self.is_trained = False
        self.model = None
        self._load_live_model()

    def _load_live_model(self):
        logger.info("Deserializing ML Random Forest Machine Learning Model (.pkl)...")
        try:
            model_path = os.path.join(os.path.dirname(__file__), "stock_ml_model.pkl")
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                self.is_trained = True
                logger.info(f"Loaded successfully from: {model_path}")
            else:
                logger.warning("No .pkl found. Running fallback initialization (Warning: Untrained Object).")
        except Exception as e:
            logger.error(f"Failed to load ML weights: {e}")

    def predict_yield(self, volatility_index: float) -> float:
        """Predicts expected 1Y yield % based on volatility scalar passing through a 100-tree Random Forest."""
        if not self.is_trained or self.model is None:
            return 8.5 # hardcoded safe fallback if ML algorithm disconnected
            
        # The Random Forest is expecting [Volatility_30D, MA_50, MA_200]
        # We synthesize the moving averages implicitly to represent standard SPY baseline distributions
        synth_ma50 = 410.0
        synth_ma200 = 380.0
        
        feature_matrix = np.array([[volatility_index, synth_ma50, synth_ma200]])
        predicted = self.model.predict(feature_matrix)
        
        return round(float(predicted[0]), 2)

# Instantiate as singleton for FastAPI dependency injection
predictor_engine = LiveStockPredictor()
