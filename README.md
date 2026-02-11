# ZTACK - Tech Stack Visualizer and Organizer

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://oddzac.github.io/ztack)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**ZTACK** is a modern, interactive web application for visualizing and organizing technology stacks. Built with vanilla JavaScript and HTML5 Canvas, it provides dual visualization modes: a high-level rotary carousel stack view and C4-style architecture diagrams.

![ZTACK Screenshot](screenshot.png)

## 🚀 Live Demo

Visit the live application: [https://oddzac.github.io/ztack](https://oddzac.github.io/ztack)

## ✨ Features

### Current Features (v1.0)

#### 🎨 Dual Visualization Modes
- **Stack View**: Interactive 3D circular carousel with smooth animations
  - Infinite scroll navigation (keyboard & mouse wheel)
  - Diamond-shaped layer cards with color-coded borders
  - Vertical substack visualization
  - Real-time layer selection and editing

- **Diagram View**: C4-style architecture diagrams
  - Component-specific shapes (rectangles, cylinders, hexagons, clouds)
  - Visual icons for quick identification
  - Drag-and-drop node positioning
  - Connection arrows showing relationships
  - Click-to-edit functionality

#### 📊 Layer Management
- Create, edit, and delete layers
- Hierarchical substacks for detailed component breakdown
- Layer properties:
  - Name, Type, Status (Active/Inactive/Deprecated)
  - Technology stack
  - Description and responsibilities
  - Connections to other components
- Sort layers by name, type, or status

#### 🔗 Relationship Mapping
- Visual connection system between components
- Multi-select checkbox interface for defining relationships
- Automatic arrow rendering in diagram view
- Bidirectional relationship support

#### 💾 Project Management
- **New**: Create fresh projects
- **Open**: Import JSON project files
- **Save**: Export projects as JSON
- Auto-save to browser localStorage
- Project statistics dashboard

#### 🎯 Professional Features
- Color-coded component types (Frontend, Backend, API, Database, DevOps, Core)
- C4 model compliance with proper visual notation
- Responsive 2-column details panel
- Real-time synchronization between views
- Smooth animations and transitions

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API
- **Styling**: CSS3 with custom properties
- **Data Format**: JSON
- **Deployment**: GitHub Pages (static hosting)

## 📦 Installation & Setup

### For GitHub Pages Deployment

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ztack.git
cd ztack
```

2. The application is fully client-side and requires no build process. Simply open `index.html` in a browser or deploy to GitHub Pages.

3. To deploy to GitHub Pages:
   - Push to your repository
   - Go to Settings → Pages
   - Select branch and root folder
   - Your app will be live at `https://yourusername.github.io/ztack`

### Local Development

Simply open `index.html` in a modern web browser. No server required!

For live reload during development, use a simple HTTP server:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

## 📖 Usage Guide

### Creating Your First Stack

1. **Add Layers**: Click "+ Add Layer" to create components
2. **Edit Details**: Select a layer to edit its properties in the right panel
3. **Define Connections**: Check boxes in the Connections section to link components
4. **Add Substacks**: Click "+ Add Substack Layer" to create nested components
5. **Navigate**: Use arrow keys or scroll to move through layers
   - ↑/↓: Navigate main stack
   - →: Enter substack
   - ←: Exit substack

### Switching Views

- **View → Stack View**: 3D carousel visualization
- **View → Diagram View**: C4 architecture diagram
- Both views stay synchronized in real-time

### Saving & Loading

- **File → Save**: Download project as JSON
- **File → Open**: Load existing project
- **File → New**: Start fresh project

## 🎯 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate layers |
| ←/→ | Enter/exit substacks |
| Mouse Wheel | Scroll through layers |

## 🗺️ Roadmap

### Phase 4: Export & Documentation (Planned)
- [ ] Export diagrams to PNG/SVG
- [ ] Generate markdown documentation
- [ ] Export to PlantUML/Mermaid formats
- [ ] PDF report generation

### Phase 5: Enterprise Features (Planned)
- [ ] Cost tracking per component
- [ ] SLA/uptime requirements
- [ ] Security compliance tags (SOC2, HIPAA, GDPR)
- [ ] Performance metrics (latency, throughput)
- [ ] Scalability indicators
- [ ] Data flow annotations

### Phase 6: Integration & Automation (Planned)
- [ ] Import from Terraform/CloudFormation
- [ ] Import from Docker Compose
- [ ] Auto-detect tech stack from GitHub repos
- [ ] CI/CD pipeline integration
- [ ] Infrastructure-as-code sync

### Phase 7: Advanced Visualization (Planned)
- [ ] Full C4 model levels (Context, Container, Component, Code)
- [ ] Deployment view with physical infrastructure
- [ ] Data flow diagrams
- [ ] Sequence diagrams
- [ ] Network topology view

### Phase 8: Analysis & Insights (Planned)
- [ ] Dependency analysis
- [ ] Risk assessment (single points of failure)
- [ ] Cost optimization suggestions
- [ ] Security vulnerability scanning
- [ ] Performance bottleneck identification
- [ ] Tech debt tracking

### Phase 9: Collaboration (Planned)
- [ ] Team collaboration features
- [ ] Comments and annotations
- [ ] Version history/changelog
- [ ] Share links (view-only)
- [ ] Real-time co-editing

### Phase 10: Templates & Standards (Planned)
- [ ] Pre-built architecture templates
- [ ] Industry-specific templates (fintech, healthcare, e-commerce)
- [ ] Company-specific component libraries
- [ ] Compliance templates (PCI-DSS, HIPAA)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the C4 model for visualizing software architecture
- Built with modern web standards and vanilla JavaScript
- Designed for simplicity, performance, and professional use

## 📧 Contact

Project Link: [https://github.com/oddzac/ztack](https://github.com/oddzac/ztack)

---

**Made with ❤️ for architects, developers, and technical teams**
