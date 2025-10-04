# Contributing to Slack Clone

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/slack-clone.git
   cd slack-clone
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up development environment**
   - Follow instructions in `SETUP_GUIDE.md`
   - Ensure all tests pass locally

## 📝 Development Workflow

### Making Changes

1. **Write clean code**
   - Follow existing code style
   - Use TypeScript types properly
   - Add comments for complex logic

2. **Test your changes**
   - Test locally before committing
   - Verify no console errors
   - Check WebSocket functionality

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

### Commit Message Guidelines

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add direct messaging feature
fix: resolve WebSocket connection issue
docs: update setup guide with new steps
```

## 🎯 What to Contribute

### High Priority
- [ ] Direct message UI implementation
- [ ] File upload UI implementation
- [ ] Message threading UI
- [ ] Search functionality
- [ ] Unit tests
- [ ] Integration tests

### Medium Priority
- [ ] Rich text editor
- [ ] Notification system
- [ ] User profile settings
- [ ] Mobile responsiveness improvements
- [ ] Performance optimizations

### Low Priority
- [ ] Custom emojis
- [ ] Message pinning
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Internationalization (i18n)

## 🏗️ Project Structure

### Backend (NestJS)
```
backend/src/
├── auth/          # Authentication logic
├── users/         # User management
├── workspaces/    # Workspace features
├── channels/      # Channel management
├── messages/      # Messaging logic
├── gateway/       # WebSocket gateway
└── prisma/        # Database service
```

### Frontend (React)
```
frontend/src/
├── components/    # Reusable components
├── pages/         # Page components
├── stores/        # State management
├── services/      # API & Socket services
└── types/         # TypeScript types
```

## 🧪 Testing Guidelines

### Backend Tests
```bash
cd backend
npm test                # Run all tests
npm test:watch         # Watch mode
npm test:cov          # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test              # Run tests
npm test:coverage     # Coverage report
```

## 📋 Pull Request Process

1. **Update documentation**
   - Update README.md if needed
   - Update FEATURES.md for new features
   - Add JSDoc comments to functions

2. **Create pull request**
   - Use descriptive title
   - Explain what and why
   - Reference any related issues
   - Add screenshots for UI changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   How to test these changes
   
   ## Screenshots (if applicable)
   Add screenshots here
   
   ## Checklist
   - [ ] Code follows project style
   - [ ] Self-reviewed the code
   - [ ] Commented complex code
   - [ ] Updated documentation
   - [ ] No new warnings
   - [ ] Tested locally
   ```

4. **Review process**
   - Wait for review
   - Address feedback
   - Make requested changes
   - Get approval and merge

## 💡 Feature Request Process

1. **Check existing issues**
   - Search for similar requests
   - Avoid duplicates

2. **Create detailed issue**
   ```markdown
   **Feature Description**
   Clear description of the feature
   
   **Use Case**
   Why is this needed?
   
   **Proposed Solution**
   How could it work?
   
   **Alternatives Considered**
   Other approaches
   ```

3. **Discuss**
   - Engage with maintainers
   - Refine the proposal
   - Get approval before implementing

## 🐛 Bug Report Process

1. **Check if already reported**
2. **Create detailed bug report**
   ```markdown
   **Bug Description**
   Clear description of the bug
   
   **Steps to Reproduce**
   1. Step one
   2. Step two
   3. Error occurs
   
   **Expected Behavior**
   What should happen
   
   **Actual Behavior**
   What actually happens
   
   **Environment**
   - OS: Windows 10
   - Browser: Chrome 120
   - Node: 20.11.0
   
   **Screenshots/Logs**
   Add error logs or screenshots
   ```

## 🎨 Code Style Guidelines

### TypeScript
- Use explicit types, avoid `any`
- Use interfaces for objects
- Use enums for constants
- Prefer `const` over `let`

### React
- Use functional components
- Use hooks properly
- Keep components small
- Extract reusable logic to custom hooks

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase (e.g., `MessageItem.tsx`)
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_URL`)
- **Interfaces**: PascalCase with `I` prefix optional

### Formatting
- Use Prettier for formatting
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters

## 🔒 Security Guidelines

### Do's
- ✅ Validate all user input
- ✅ Use environment variables for secrets
- ✅ Sanitize data before display
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Implement rate limiting
- ✅ Use HTTPS in production

### Don'ts
- ❌ Never commit secrets or API keys
- ❌ Don't trust client-side validation alone
- ❌ Don't store passwords in plain text
- ❌ Don't expose sensitive error details
- ❌ Don't disable CORS in production

## 📚 Resources

### Documentation
- [NestJS Docs](https://docs.nestjs.com)
- [React Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Socket.io Docs](https://socket.io/docs)

### Learning
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Patterns](https://reactpatterns.com)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

## 🤝 Code of Conduct

### Our Pledge
We are committed to providing a friendly, safe, and welcoming environment for all contributors.

### Expected Behavior
- Be respectful and considerate
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

## 💬 Communication

### Where to Ask Questions
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Request Comments**: Code-specific discussions

### Response Times
- We aim to respond within 48 hours
- Complex PRs may take longer to review
- Be patient and respectful

## 🎁 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉

Your contributions help make this project better for everyone.
