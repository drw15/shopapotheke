# Prediction matrix

Every modelled combination in the prototype, straight from the fixtures.

**This is mock data.** These are fabricated demo values standing in for a real
delivery prediction service. They are not Redcare data and make no claim about
real carrier performance.

The point of publishing it is to show the transformation the product layer performs:

```
carrier-specific distribution  ->  exposure decision  ->  rounded business days  ->  calendar promise
```

Exposure gates: confidence >= 0.9, calibration error <= 0.03, support >= 500. All three must pass.

A withheld row is not an error: the model returned a value and product policy declined to show it. The customer sees `Lieferung in 1–3 Werktagen` and is never told why.

| Product | PLZ | City | Method | Carrier | mean | q10 | q50 | q90 | conf. | calib. | n | Exposed? | Window | Customer sees |
|---|---|---|---|---|--:|--:|--:|--:|--:|--:|--:|---|---|---|
| Voltaren Schmerzgel | 50667 | Köln | home | DHL | 1.14 | 0.62 | 1.1 | 1.58 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 50667 | Köln | home | HERMES | 1.25 | 0.71 | 1.21 | 1.72 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 50667 | Köln | pickup | DHL | 1.23 | 0.67 | 1.19 | 1.7 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 50667 | Köln | pickup | HERMES | 1.33 | 0.75 | 1.29 | 1.82 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 60311 | Frankfurt am Main | home | DHL | 1.23 | 0.71 | 1.19 | 1.66 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 60311 | Frankfurt am Main | home | HERMES | 1.35 | 0.79 | 1.31 | 1.83 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 60311 | Frankfurt am Main | pickup | DHL | 1.33 | 0.77 | 1.29 | 1.8 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 60311 | Frankfurt am Main | pickup | HERMES | 1.42 | 0.84 | 1.38 | 1.92 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 22083 | Hamburg | home | DHL | 1.39 | 1.08 | 1.35 | 1.62 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 22083 | Hamburg | home | HERMES | 1.52 | 1.15 | 1.48 | 1.81 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 22083 | Hamburg | pickup | DHL | 1.33 | 1.04 | 1.29 | 1.53 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 22083 | Hamburg | pickup | HERMES | 1.59 | 1.18 | 1.55 | 1.92 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Voltaren Schmerzgel | 10115 | Berlin | home | DHL | 1.87 | 1.24 | 1.83 | 2.41 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Voltaren Schmerzgel | 10115 | Berlin | home | HERMES | 2.04 | 1.35 | 2 | 2.65 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Voltaren Schmerzgel | 10115 | Berlin | pickup | DHL | 1.98 | 1.31 | 1.94 | 2.57 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Voltaren Schmerzgel | 10115 | Berlin | pickup | HERMES | 2.13 | 1.41 | 2.09 | 2.78 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Voltaren Schmerzgel | 80331 | München | home | DHL | 2.12 | 1.64 | 2.08 | 2.52 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Voltaren Schmerzgel | 80331 | München | home | HERMES | 2.26 | 1.74 | 2.22 | 2.7 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Voltaren Schmerzgel | 80331 | München | pickup | DHL | 2.21 | 1.7 | 2.17 | 2.64 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Voltaren Schmerzgel | 80331 | München | pickup | HERMES | 2.34 | 1.79 | 2.3 | 2.8 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Vitamin D3 | 50667 | Köln | home | DHL | 1.18 | 0.65 | 1.14 | 1.63 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Vitamin D3 | 50667 | Köln | home | HERMES | 1.3 | 0.74 | 1.25 | 1.77 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Vitamin D3 | 50667 | Köln | pickup | DHL | 1.27 | 0.7 | 1.23 | 1.75 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Vitamin D3 | 50667 | Köln | pickup | HERMES | 1.37 | 0.78 | 1.33 | 1.87 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Vitamin D3 | 60311 | Frankfurt am Main | home | DHL | 1.27 | 0.74 | 1.23 | 1.71 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Vitamin D3 | 60311 | Frankfurt am Main | home | HERMES | 1.39 | 0.82 | 1.35 | 1.88 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Vitamin D3 | 60311 | Frankfurt am Main | pickup | DHL | 1.37 | 0.8 | 1.33 | 1.85 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Vitamin D3 | 60311 | Frankfurt am Main | pickup | HERMES | 1.46 | 0.87 | 1.42 | 1.97 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Vitamin D3 | 22083 | Hamburg | home | DHL | 1.43 | 1.11 | 1.39 | 1.67 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Vitamin D3 | 22083 | Hamburg | home | HERMES | 1.56 | 1.18 | 1.52 | 1.86 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Vitamin D3 | 22083 | Hamburg | pickup | DHL | 1.37 | 1.07 | 1.33 | 1.58 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Vitamin D3 | 22083 | Hamburg | pickup | HERMES | 1.63 | 1.21 | 1.59 | 1.97 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Vitamin D3 | 10115 | Berlin | home | DHL | 1.91 | 1.27 | 1.87 | 2.46 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Vitamin D3 | 10115 | Berlin | home | HERMES | 2.08 | 1.38 | 2.04 | 2.7 | 0.93 | 0.062 | 2600 | no (poor-calibration) | - | Lieferung in 1–3 Werktagen |
| Vitamin D3 | 10115 | Berlin | pickup | DHL | 2.02 | 1.34 | 1.98 | 2.62 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Vitamin D3 | 10115 | Berlin | pickup | HERMES | 2.17 | 1.44 | 2.13 | 2.83 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Vitamin D3 | 80331 | München | home | DHL | 2.16 | 1.67 | 2.12 | 2.57 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Vitamin D3 | 80331 | München | home | HERMES | 2.3 | 1.77 | 2.26 | 2.75 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Vitamin D3 | 80331 | München | pickup | DHL | 2.25 | 1.73 | 2.21 | 2.69 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Vitamin D3 | 80331 | München | pickup | HERMES | 2.38 | 1.82 | 2.34 | 2.85 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Fenistil Kühl | 50667 | Köln | home | DHL | 1.15 | 0.6 | 1.11 | 1.61 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Fenistil Kühl | 50667 | Köln | home | HERMES | 1.26 | 0.69 | 1.22 | 1.75 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Fenistil Kühl | 50667 | Köln | pickup | DHL | 1.23 | 0.65 | 1.19 | 1.73 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Fenistil Kühl | 50667 | Köln | pickup | HERMES | 1.33 | 0.73 | 1.29 | 1.85 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Fenistil Kühl | 60311 | Frankfurt am Main | home | DHL | 1.23 | 0.69 | 1.19 | 1.69 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Fenistil Kühl | 60311 | Frankfurt am Main | home | HERMES | 1.36 | 0.77 | 1.32 | 1.86 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Fenistil Kühl | 60311 | Frankfurt am Main | pickup | DHL | 1.33 | 0.75 | 1.29 | 1.83 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Fenistil Kühl | 60311 | Frankfurt am Main | pickup | HERMES | 1.43 | 0.82 | 1.39 | 1.95 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Fenistil Kühl | 22083 | Hamburg | home | DHL | 1.4 | 1.06 | 1.36 | 1.65 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Fenistil Kühl | 22083 | Hamburg | home | HERMES | 1.53 | 1.13 | 1.49 | 1.84 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Fenistil Kühl | 22083 | Hamburg | pickup | DHL | 1.33 | 1.02 | 1.29 | 1.56 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Fenistil Kühl | 22083 | Hamburg | pickup | HERMES | 1.6 | 1.16 | 1.56 | 1.95 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Fenistil Kühl | 10115 | Berlin | home | DHL | 1.87 | 1.22 | 1.83 | 2.44 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Fenistil Kühl | 10115 | Berlin | home | HERMES | 2.24 | 1.28 | 2.2 | 3.12 | 0.93 | 0.021 | 2600 | yes | 2-4 Werktage | calendar date window |
| Fenistil Kühl | 10115 | Berlin | pickup | DHL | 1.99 | 1.29 | 1.95 | 2.6 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Fenistil Kühl | 10115 | Berlin | pickup | HERMES | 2.14 | 1.39 | 2.1 | 2.81 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Fenistil Kühl | 80331 | München | home | DHL | 2.13 | 1.62 | 2.09 | 2.55 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Fenistil Kühl | 80331 | München | home | HERMES | 2.27 | 1.72 | 2.23 | 2.73 | 0.81 | 0.023 | 1900 | no (low-confidence) | - | Lieferung in 1–3 Werktagen |
| Fenistil Kühl | 80331 | München | pickup | DHL | 2.22 | 1.68 | 2.17 | 2.67 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Fenistil Kühl | 80331 | München | pickup | HERMES | 2.34 | 1.77 | 2.3 | 2.83 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 50667 | Köln | home | DHL | 1.2 | 0.66 | 1.16 | 1.65 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 50667 | Köln | home | HERMES | 1.31 | 0.75 | 1.27 | 1.79 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 50667 | Köln | pickup | DHL | 1.28 | 0.71 | 1.24 | 1.77 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 50667 | Köln | pickup | HERMES | 1.38 | 0.79 | 1.34 | 1.89 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 60311 | Frankfurt am Main | home | DHL | 1.28 | 0.75 | 1.24 | 1.73 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 60311 | Frankfurt am Main | home | HERMES | 1.41 | 0.83 | 1.37 | 1.9 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 60311 | Frankfurt am Main | pickup | DHL | 1.38 | 0.81 | 1.34 | 1.87 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 60311 | Frankfurt am Main | pickup | HERMES | 1.48 | 0.88 | 1.44 | 1.99 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 22083 | Hamburg | home | DHL | 1.45 | 1.12 | 1.41 | 1.69 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 22083 | Hamburg | home | HERMES | 1.58 | 1.19 | 1.54 | 1.88 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 22083 | Hamburg | pickup | DHL | 1.38 | 1.08 | 1.34 | 1.6 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 22083 | Hamburg | pickup | HERMES | 1.65 | 1.22 | 1.61 | 1.99 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 10115 | Berlin | home | DHL | 1.92 | 1.28 | 1.88 | 2.48 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 10115 | Berlin | home | HERMES | 2.1 | 1.39 | 2.06 | 2.72 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 10115 | Berlin | pickup | DHL | 2.04 | 1.35 | 2 | 2.64 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 10115 | Berlin | pickup | HERMES | 2.19 | 1.45 | 2.15 | 2.85 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Ibu-ratiopharm 400 | 80331 | München | home | DHL | 2.17 | 1.68 | 2.13 | 2.59 | 0.92 | 0.023 | 180 | no (low-support) | - | Lieferung in 1–3 Werktagen |
| Ibu-ratiopharm 400 | 80331 | München | home | HERMES | 2.32 | 1.78 | 2.28 | 2.77 | 0.92 | 0.023 | 210 | no (low-support) | - | Lieferung in 1–3 Werktagen |
| Ibu-ratiopharm 400 | 80331 | München | pickup | DHL | 2.27 | 1.74 | 2.23 | 2.71 | 0.92 | 0.023 | 190 | no (low-support) | - | Lieferung in 1–3 Werktagen |
| Ibu-ratiopharm 400 | 80331 | München | pickup | HERMES | 2.39 | 1.83 | 2.35 | 2.87 | 0.92 | 0.023 | 205 | no (low-support) | - | Lieferung in 1–3 Werktagen |
| Bepanthen Wund- | 50667 | Köln | home | DHL | 1.37 | 0.78 | 1.33 | 1.88 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Bepanthen Wund- | 50667 | Köln | home | HERMES | 1.49 | 0.87 | 1.45 | 2.02 | 0.96 | 0.012 | 5400 | yes | 1-3 Werktage | calendar date window |
| Bepanthen Wund- | 50667 | Köln | pickup | DHL | 1.46 | 0.83 | 1.42 | 2 | 0.96 | 0.012 | 5400 | yes | 1-2 Werktage | calendar date window |
| Bepanthen Wund- | 50667 | Köln | pickup | HERMES | 1.56 | 0.91 | 1.52 | 2.12 | 0.96 | 0.012 | 5400 | yes | 1-3 Werktage | calendar date window |
| Bepanthen Wund- | 60311 | Frankfurt am Main | home | DHL | 1.46 | 0.87 | 1.42 | 1.96 | 0.95 | 0.015 | 4100 | yes | 1-2 Werktage | calendar date window |
| Bepanthen Wund- | 60311 | Frankfurt am Main | home | HERMES | 1.58 | 0.95 | 1.54 | 2.13 | 0.95 | 0.015 | 4100 | yes | 1-3 Werktage | calendar date window |
| Bepanthen Wund- | 60311 | Frankfurt am Main | pickup | DHL | 1.56 | 0.93 | 1.52 | 2.1 | 0.95 | 0.015 | 4100 | yes | 1-3 Werktage | calendar date window |
| Bepanthen Wund- | 60311 | Frankfurt am Main | pickup | HERMES | 1.65 | 1 | 1.61 | 2.22 | 0.95 | 0.015 | 4100 | yes | 1-3 Werktage | calendar date window |
| Bepanthen Wund- | 22083 | Hamburg | home | DHL | 1.62 | 1.24 | 1.58 | 1.92 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Bepanthen Wund- | 22083 | Hamburg | home | HERMES | 1.75 | 1.31 | 1.71 | 2.11 | 0.94 | 0.018 | 3300 | yes | 2-3 Werktage | calendar date window |
| Bepanthen Wund- | 22083 | Hamburg | pickup | DHL | 1.56 | 1.2 | 1.52 | 1.83 | 0.94 | 0.018 | 3300 | yes | 2-2 Werktage | calendar date window |
| Bepanthen Wund- | 22083 | Hamburg | pickup | HERMES | 1.82 | 1.34 | 1.78 | 2.22 | 0.94 | 0.018 | 3300 | yes | 2-3 Werktage | calendar date window |
| Bepanthen Wund- | 10115 | Berlin | home | DHL | 2.09 | 1.4 | 2.05 | 2.71 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Bepanthen Wund- | 10115 | Berlin | home | HERMES | 2.27 | 1.51 | 2.23 | 2.95 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Bepanthen Wund- | 10115 | Berlin | pickup | DHL | 2.21 | 1.47 | 2.17 | 2.87 | 0.93 | 0.021 | 2600 | yes | 2-3 Werktage | calendar date window |
| Bepanthen Wund- | 10115 | Berlin | pickup | HERMES | 2.37 | 1.57 | 2.33 | 3.08 | 0.93 | 0.021 | 2600 | yes | 2-4 Werktage | calendar date window |
| Bepanthen Wund- | 80331 | München | home | DHL | 2.35 | 1.8 | 2.31 | 2.82 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Bepanthen Wund- | 80331 | München | home | HERMES | 2.49 | 1.9 | 2.45 | 3 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Bepanthen Wund- | 80331 | München | pickup | DHL | 2.44 | 1.86 | 2.4 | 2.94 | 0.92 | 0.023 | 1900 | yes | 2-3 Werktage | calendar date window |
| Bepanthen Wund- | 80331 | München | pickup | HERMES | 2.57 | 1.95 | 2.53 | 3.1 | 0.92 | 0.023 | 1900 | yes | 2-4 Werktage | calendar date window |

## Summary

- 100 modelled combinations
- 94 safe to expose
- 6 withheld, all falling back to the broad promise
- Vagisan appears nowhere: the model has no coverage for it at all

### Withheld combinations

| Product | PLZ | Method | Carrier | Reason |
|---|---|---|---|---|
| Vitamin D3 | 10115 | home | HERMES | poor-calibration |
| Fenistil Kühl | 80331 | home | HERMES | low-confidence |
| Ibu-ratiopharm 400 | 80331 | home | DHL | low-support |
| Ibu-ratiopharm 400 | 80331 | home | HERMES | low-support |
| Ibu-ratiopharm 400 | 80331 | pickup | DHL | low-support |
| Ibu-ratiopharm 400 | 80331 | pickup | HERMES | low-support |
