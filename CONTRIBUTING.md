# Contributing to Contextual Feedback Component

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/laughing-system.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Type check
npm run type-check
```

## Code Style

- Use TypeScript for all new code
- Follow existing code style and patterns
- Use ESLint and Prettier (configured in the project)
- Write self-documenting code with clear variable names
- Add JSDoc comments for public APIs

## Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Aim for good test coverage
- Test accessibility features manually

## Pull Request Process

1. Update CHANGELOG.md with your changes
2. Ensure all tests pass
3. Ensure linting passes
4. Update documentation if needed
5. Create a pull request with a clear description

## Commit Messages

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting
- `refactor:` for code refactoring
- `test:` for tests
- `chore:` for maintenance

Example: `feat: add support for custom annotation colors`

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints

## Questions?

Open an issue for questions or discussions about contributions.
