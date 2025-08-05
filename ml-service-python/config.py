import os

# --- Directory and File Paths ---
# Base directory for storing all persistent data
STORAGE_BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "storage")
# Directory to store the uploaded dataset
DATA_DIR = os.path.join(STORAGE_BASE_DIR, "data")
# Directory to store model artifacts like features list, models, etc.
ARTIFACTS_DIR = os.path.join(STORAGE_BASE_DIR, "artifacts")

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# --- Filenames ---
# Name for the stored dataset CSV. It's augmented with timestamps by the .NET backend.
DATASET_FILENAME = "full_dataset_with_ts.csv"
# Name for the file that will store the list of most important features.
IMPORTANT_FEATURES_FILENAME = "important_features.json"

# --- Filenames for split datasets ---
TRAIN_SET_FILENAME = "train_set.csv"
TEST_SET_FILENAME = "test_set.csv"
SIMULATION_SET_FILENAME = "simulation_set.csv"

# --- Full Paths ---
# The complete path to where the dataset will be stored.
DATASET_FILE_PATH = os.path.join(DATA_DIR, DATASET_FILENAME)
# The complete path to where the important features list will be saved.
IMPORTANT_FEATURES_PATH = os.path.join(ARTIFACTS_DIR, IMPORTANT_FEATURES_FILENAME)


# --- Full paths for split datasets ---
TRAIN_SET_PATH = os.path.join(DATA_DIR, TRAIN_SET_FILENAME)
TEST_SET_PATH = os.path.join(DATA_DIR, TEST_SET_FILENAME)
SIMULATION_SET_PATH = os.path.join(DATA_DIR, SIMULATION_SET_FILENAME)

# --- ML Pipeline Constants ---
# --- Feature Selection ---
CHUNK_SIZE = 100000  # How many rows to read into memory at a time
SAMPLE_FRACTION = 0.01  # Use 1% of data for the preliminary feature selection model
N_TOP_FEATURES = 100  # The number of top features to select

# Use 20% of the total data for training/testing, as per the notebook.
DATA_SAMPLE_FRACTION_FOR_TRAINING = 0.20

# --- Data Columns ---
ID_COLUMN = "Id"
TARGET_COLUMN = "Response"
TIMESTAMP_COLUMN = "synthetic_timestamp"  # This column is added by the .NET backend
