# EV Charging Accessibility & Spatial Equity Atlas

**[Launch the live atlas](https://babak-rj-az.github.io/evcs-spatial-equity-atlas/)**  
**[View the published paper](https://doi.org/10.1109/ICECET63943.2025.11472348)**

An interactive GIS based research prototype for exploring and comparing the accessibility and spatial equity of public electric vehicle charging infrastructure across **Amsterdam, Milan, Naples and Palermo**.

This project translates the spatial analysis from the following publication into an accessible web map:

> Ranjgar, B., Niccolai, A., and Leva, S. (2025). *Electric Vehicles Charging Stations Distribution Equity Assessment Using GIS and Gini Coefficient*. ICECET 2025. https://doi.org/10.1109/ICECET63943.2025.11472348

## What you can explore

- Switch between four European case study cities
- View public EV charging station locations
- Explore effective 1 km service areas and Thiessen allocation zones
- Map population coverage, area coverage and population by service zone
- Inspect service zone statistics interactively
- Compare population based and area based Gini coefficients across cities

## Study results at a glance

| City | EVCS records | Population Gini | Area Gini |
|---|---:|---:|---:|
| Amsterdam | 436 | 0.42 | 0.49 |
| Milan | 182 | 0.53 | 0.56 |
| Palermo | 21 | 0.57 | 0.59 |
| Naples | 15 | 0.61 | 0.65 |

Lower Gini coefficients indicate a more even distribution in the respective assessment scenario.

## Data and methods

Three primary datasets were used:

1. City study boundaries from governmental spatial data sources
2. High resolution population raster from Meta Data for Good
3. EV charging station locations retrieved from the Open Charge Map API

The original spatial workflow was implemented in ArcGIS Pro. EVCS points and population data were clipped to each city study boundary. Thiessen polygons were created to allocate locations to their nearest charging station. One kilometre buffers were intersected with the corresponding Thiessen zones, and population and area coverage were calculated for every service zone. Lorenz curves and Gini coefficients were then calculated in Python for population based and area based equity assessment.

### Milan duplicate coordinate note

The Milan source dataset contains 182 charging station records but 181 service zones. Two station records share identical coordinates and therefore cannot generate distinct Thiessen polygons. Both source records remain in the EVCS point layer, while the allocation analysis contains 181 unique service zones.

## Repository structure

```text
assets/       website styling
data/         cleaned web ready GeoJSON layers for all four cities
src/          interactive map JavaScript
notebooks/    original Gini and Lorenz curve analysis
index.html    GitHub Pages application
```

## Run locally

Because the page loads local GeoJSON files, open it through a simple local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Data attribution

- Study boundaries: governmental spatial data sources used in the original analysis
- Population: Meta Data for Good
- Charging station locations: Open Charge Map
- Basemap: OpenStreetMap contributors

The repository contains processed research outputs for visualization. Users should review the licences and terms of the original data providers before redistributing or reusing source data.

## Scope

This is an initial public research prototype accompanying the published study. Planned development includes interactive Lorenz curves, additional urban accessibility indicators, clearer reproducibility workflows and extension to other urban infrastructure types.

## Author

**Babak Ranjgar**  
Geospatial Data Science · GIScience · Urban Analytics

Live project: https://babak-rj-az.github.io/evcs-spatial-equity-atlas/  
Repository: https://github.com/Babak-RJ-AZ/evcs-spatial-equity-atlas
