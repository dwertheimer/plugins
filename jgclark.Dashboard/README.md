# 🎛 Dashboard plugin
This plugin provides a **dashboard window** that in one place shows a compact list of just the:
- open tasks and checklists from today's note
- scheduled open tasks and checklists from other notes to today
- open tasks and checklists from this week's note
- scheduled open tasks and checklists from other notes to this week
- open tasks and checklists from this month's note
- scheduled open tasks and checklists from other notes to this month
- next few notes to review (if you use the "Projects and Reviews" plugin)

To open this run the **/show dashboard** command.

![](Dashboard-v0.3.5@2x)

All tasks and checklists can be marked as completed by clicking in its usual open circle or square. The item is then completed in NotePlan, and removed from view in this list.

Note: _It provides this in a view that doesn't use NotePlan's normal editor, but a more flexible HTML-based display that mimics your current NotePlan theme._

Note: _This plugin cannot work effectively on an **iPhone**-sized device, so it is disabled there.  On an **iPad** windows can't float in the same way as they can on macOS, so while the checking-off of tasks should work on iPad, tapping on links won't work as I can't dismiss the window from the plugin._

If already open, the dashboard window will now automatically update when a change is made in the relevant calendar note(s) if you have [added a trigger to the frontmatter](https://help.noteplan.co/article/173-plugin-note-triggers) of the relevant daily/weekly/monthly note(s):

```yaml
---
triggers: onEditorWillSave => jgclark.Dashboard.decideWhetherToUpdateDasboard
---
```

Other notes:
- when the window is wide enough, it will switch to a multi-column display
- it de-dupes items that would appear twice in a list where the lines are sync'd together.

## Getting started
This requires the 'Shared Resources' plugin to be installed as well, to work and display properly. The Dashboard should automatically offer to install it if it isn't already.

## Known Issue
I'm trying to solve a problem when using this with its trigger, that NP hasn't finished updating itself before it re-calculates the Dashboard display.

## Support
If you find an issue with this plugin, or would like to suggest new features for it, please raise a [Bug or Feature 'Issue'](https://github.com/NotePlan/plugins/issues).

If you would like to support my late-night work extending NotePlan through writing these plugins, you can through:

[<img width="200px" alt="Buy Me A Coffee" src="https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg">](https://www.buymeacoffee.com/revjgc)

Thanks!

## History
Please see the [CHANGELOG](CHANGELOG.md).
