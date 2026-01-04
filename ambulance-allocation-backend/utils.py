import pandas as pd

def estimate_variables_from_inputs(df, scenario, avg_rainfall_mm):

    


    pop_min = df["affected_population"].min()
    pop_max = df["affected_population"].max()

    rain_norm = (avg_rainfall_mm - df["avg_rainfall_mm"].min()) / (
        df["avg_rainfall_mm"].max() - df["avg_rainfall_mm"].min()
    )

    rain_norm = max(0, min(rain_norm, 1))

    if scenario == "FLOOD_S2":
        affected_population = pop_min + rain_norm * (pop_max - pop_min)
        road_disruption_level = 5
        severity_index = 5

    else:  # FLOOD_S1
        affected_population = pop_min + 0.5 * rain_norm * (pop_max - pop_min)
        road_disruption_level = 3
        severity_index = 3

    return int(affected_population), int(road_disruption_level), int(severity_index)
