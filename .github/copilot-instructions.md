LLM Notes:

- do not run npx commands, this repo uses bun.
- If you try to validate changes made to the sveltekit app and run `bun run dev -- --host`, the terminal will hand because that's a held process.

Strive for the following:

- Introduce no asthetic related css styles to the application at all unless explicitly instructed. Only css rules regarding layout / formatting should be utilized.
- This is a static website using the static svelte adapter.
- TypeScript Support: Full type safety with proper API declarations
- Modern Svelte: Use Svelte 5 syntax with `$state` runes
- Responsive Design: Better styling that works on different screen sizes. You're free to use tailwind.
- Browser Compatibility: Clear messaging in chat responses about browser support requirements. Not displayed on the UI.
- Component Architecture: Reusable component that can be easily imported elsewhere
