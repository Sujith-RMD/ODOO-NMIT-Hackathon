$components = @('dropdown-menu', 'label', 'badge', 'skeleton', 'separator', 'tabs', 'table', 'dialog', 'select')
foreach ($c in $components) {
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/registry/new-york/ui/$c.tsx" -OutFile "src/components/ui/$c.tsx"
}
