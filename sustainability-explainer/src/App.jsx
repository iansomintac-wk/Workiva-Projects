import React from 'react';
import Header from './components/Header.jsx';
import { Hero, Thesis, WhyWorkiva, Outcomes } from './sections/Intro.jsx';
import ChapterWhat from './sections/ChapterWhat.jsx';
import ChapterCapabilities from './sections/ChapterCapabilities.jsx';
import ChapterUseCases from './sections/ChapterUseCases.jsx';
import ChapterWalkthrough from './sections/ChapterWalkthrough.jsx';
import ChapterQuestions from './sections/ChapterQuestions.jsx';
import ChapterRoadmap from './sections/ChapterRoadmap.jsx';
import { Closing, Footer } from './sections/Closing.jsx';

export default function App() {
  return (
    <div className="page">
      <Header />
      <main>
        <Hero />
        <Thesis />
        <WhyWorkiva />
        <Outcomes />
        <ChapterWhat />
        <ChapterCapabilities />
        <ChapterUseCases />
        <ChapterWalkthrough />
        <ChapterQuestions />
        <ChapterRoadmap />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
