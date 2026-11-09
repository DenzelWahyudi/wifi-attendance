"""
Grouped bar chart: number of students who checked in during each minute,
one bar per spreadsheet tab so the classes can be compared side by side.

Usage:
    pip install pandas openpyxl matplotlib
    python attendance_per_minute.py
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

FILE = "C:/Users/denze/Documents/wifi-attendance/results/Copy of Hasil Penelitian Scientific Writing.xlsx"   # <- path to your file
OUTPUT_PNG = "attendance_per_minute.png"
COLS = ["Name", "Identity Number", "Check-in Time", "Status"]


def load_sheet(path, sheet):
    """Read a tab; works whether or not it has a header row."""
    df = pd.read_excel(path, sheet_name=sheet, header=None, names=COLS)
    # Drop a header row if the tab has one (some tabs do, some don't)
    df = df[df["Status"].astype(str).str.strip().str.lower() != "status"]
    # Keep only students who actually attended and have a valid timestamp
    df = df[df["Status"].astype(str).str.strip().str.lower() == "present"].copy()
    df["Check-in Time"] = pd.to_datetime(df["Check-in Time"], errors="coerce", utc=True)
    return df.dropna(subset=["Check-in Time"])


def attendance_per_minute(df):
    """Count check-ins per minute, counted from the first check-in (minute 1)."""
    start = df["Check-in Time"].min().floor("min")
    minute = ((df["Check-in Time"].dt.floor("min") - start) // pd.Timedelta("1min")) + 1
    return minute.value_counts().sort_index()


def main():
    sheets = pd.ExcelFile(FILE).sheet_names
    counts = {s: attendance_per_minute(load_sheet(FILE, s)) for s in sheets}

    max_min = max(c.index.max() for c in counts.values())
    minutes = np.arange(1, max_min + 1)

    fig, ax = plt.subplots(figsize=(max(10, max_min * 0.7), 6))
    width = 0.8 / len(sheets)

    for i, (name, c) in enumerate(counts.items()):
        values = c.reindex(minutes, fill_value=0).values
        offset = (i - (len(sheets) - 1) / 2) * width
        bars = ax.bar(minutes + offset, values, width, label=f"{name} (total {c.sum()})")
        # amount of students on top of each bar
        for b, v in zip(bars, values):
            if v > 0:
                ax.text(b.get_x() + b.get_width() / 2, v + 0.15, str(v),
                        ha="center", va="bottom", fontsize=8)

    ax.set_xlabel("Minute since first check-in")
    ax.set_ylabel("Number of students who attended")
    ax.set_title("Attendance per Minute – Class Comparison")
    ax.set_xticks(minutes)
    ax.yaxis.get_major_locator().set_params(integer=True)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()
