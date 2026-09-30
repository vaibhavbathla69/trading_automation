# Design review — trading operations workspace

This product manages signals and trading risk, so CRM patterns are useful for information structure rather than for sales language or decorative widgets.

| Product | Observed design pattern | Applied here |
| --- | --- | --- |
| [Attio](https://attio.com/help/reference/attio-101/introduction-to-navigating-attio) | Persistent sidebar, clear record views, detail in the main panel | Quiet navigation and focused signal/position detail drawers |
| [Pipedrive](https://support.pipedrive.com/en/article/pipeline-view) | Stages show what is moving and what needs attention | Signal status filters and an exception queue; no drag-and-drop because trades are backend-controlled |
| [Copper](https://support.copper.com/en/articles/10509213-the-pipelines-you-know-and-love-now-better) | Conditional flags surface priority records; drill-down keeps context | Review/rejection items link straight to raw signal and parsed data |
| [Freshsales](https://crmsupport.freshworks.com/support/solutions/articles/50000005638-how-to-access-and-filter-events-on-the-account-activity-timeline-) | Activity timeline lives with the record | Event timeline is in each signal and position drawer |
| [Zoho CRM](https://help.zoho.com/portal/en/kb/crm/faqs/canvas/articles/faq-canvas-in-zoho-crm) | Tailored record layouts show fields relevant to a team | Overview shows only exposure, P&L, limits, connections, and actionable signals |
| [monday CRM](https://monday.com/crm/features) | Views and dashboards draw from the same live records | Overview and detail pages share one typed API layer |
| [Insightly](https://www.insightly.com/crm-project-management/) | Related workflow and outcomes remain in one product | Signal, position, trade, and log views share navigation and identifiers |

## Screen decisions

- The overview answers four questions: Is the system connected? What is open? What needs attention? What arrived recently?
- Detailed numbers remain in the record view. The overview uses four session metrics in one strip rather than eight separate cards.
- The dashboard removes the helper card, decorative icons, redundant activity feed, explanatory banners, and repeated status panels.
- Controls stay visible but secondary. Emergency stop remains in the top bar. Every sensitive action still requires confirmation.
- The trading backend owns state changes. The UI never permits a user to drag a signal or position into an execution state.

## Color language

| Color | Meaning |
| --- | --- |
| Cobalt blue | Waiting or incoming signal |
| Lavender | Open position / exposure |
| Acid green | Connected, live, filled, or positive P&L |
| Warm amber | Review or degraded status |
| Coral | Rejected, failed, negative P&L, or destructive action |
| Neutral | Historical, reference, or inactive information |

Every colored status also has a text label. Profit and loss values include a sign.
