My roam/css and roam/js files

# css

Throw this in a `roam/css` codeblock:

```css
/* font */
@import url("https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Work+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Source+Code+Pro&display=swap");

@import url("https://raw.githack.com/jchen1/roam-util/master/roam.css");

/* customizations */
:root {
  --header-font: "Work Sans", sans-serif;
  --body-font: "Open Sans", sans-serif;
  --monospace-font: "Source Code Pro", monospace;

  --header-color: #e1d3c6;
  --header-text-color: #333333;

  --background-color: #f7f3ee;
  --right-sidebar-background-color: #efe6dc;

  --tag-background-color: #92a3c8;
  --tag-color: #ffffff;
  --link-color: #ed5353;

  --sidebar-color: #e1d3c6;
  --sidebar-text-color: #333333;
  --sidebar-text-hover-color: #ed5353;

  --border-color: #e1d3c6;

  --right-sidebar-border-size: 0px;
}
```

# js

- copies your Daily Template into an empty Daily Notes page
- disabled on mobile because it doesn't work properly
