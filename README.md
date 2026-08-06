# EV Charging Accessibility & Spatial Equity Atlas

An interactive GIS based research prototype for exploring the accessibility and spatial equity of public electric vehicle charging infrastructure.

The current release presents the **Milan case study** from the paper:

> Ranjgar, B., Niccolai, A., and Leva, S. (2025). *Electric Vehicles Charging Stations Distribution Equity Assessment Using GIS and Gini Coefficient*. ICECET 2025. https://doi.org/10.1109/ICECET63943.2025.11472348

## Live features

- Interactive map of charging stations, effective 1 km service areas and Thiessen allocation zones
- Population and area coverage indicators at service zone level
- Summary values for population based and area based Gini coefficients
- Concise explanation of the GIS workflow and data sources

## Data and methods

Three primary datasets were used:

1. Official administrative city boundaries
2. High resolution population raster from Meta Data for Good
3. EV charging station locations retrieved from the Open Charge Map API

The workflow was implemented in ArcGIS Pro. EVCS points and population data were clipped to city boundaries. Thiessen polygons were created to allocate each location to the nearest station. One kilometre buffers were then intersected with the corresponding Thiessen zones. Population and area coverage were calculated for every service zone, followed by Lorenz curve and Gini coefficient analysis in Python.

The Milan source dataset contains 182 charging station records but 181 service zones because two source records share identical coordinates and cannot generate separate Thiessen polygons.

## Repository structure

```text
assets/       website styling
data/         cleaned and web ready GeoJSON files
src/          website JavaScript
index.html    single page application
```

## Run locally

Because the page loads local GeoJSON files, open it through a simple local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a new public repository, for example `evcs-spatial-equity-atlas`.
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/root` folder, then save.

## Current scope and roadmap

This is a rapid first release prepared as a public research sample. Planned additions include Amsterdam, Naples and Palermo, city comparison controls, interactive Lorenz curves, reusable Python functions and fuller reproducibility documentation.

## Data attribution

- Administrative boundaries: official governmental data repositories
- Population: Meta Data for Good
- Charging station locations: Open Charge Map
- Basemap: OpenStreetMap contributors

Please review the original data licences before redistributing derived datasets.
