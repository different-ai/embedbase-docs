import React, { useState } from "react";
import { DocsThemeConfig, useTheme, useConfig } from "nextra-theme-docs";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import scss from "react-syntax-highlighter/dist/cjs/languages/prism/scss";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import markdown from "react-syntax-highlighter/dist/cjs/languages/prism/markdown";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import rangeParser from "parse-numeric-range";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("scss", scss);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("json", json);

const MarkdownComponents: object = {
  code({ node, inline, className, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const hasMeta = node?.data?.meta;

    const applyHighlights: object = (applyHighlights: number) => {
      if (hasMeta) {
        const RE = /{([\d,-]+)}/;
        const metadata = node.data.meta?.replace(/\s/g, "");
        const strlineNumbers = RE?.test(metadata) ? RE?.exec(metadata)[1] : "0";
        const highlightLines = rangeParser(strlineNumbers);
        const highlight = highlightLines;
        const data: string = highlight.includes(applyHighlights)
          ? "highlight"
          : null;
        return { data };
      } else {
        return {};
      }
    };

    return match ? (
      <SyntaxHighlighter
        children={""}
        style={oneDark}
        // language={match[1]}
        PreTag="div"
        className="codeStyle"
        // showLineNumbers={true}
        wrapLines={hasMeta ? true : false}
        useInlineStyles={true}
        lineProps={applyHighlights}
        {...props}
      />
    ) : (
      <code className={className} {...props} />
    );
  },
};

const Modal = ({ children, open, onClose }) => {
  const theme = useTheme();
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: theme.resolvedTheme === "dark" ? "#1a1a1a" : "white",
          padding: 20,
          borderRadius: 5,
          width: "80%",
          maxWidth: 700,
          maxHeight: "80%",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const questions = [
  "What is Embedbase?",
  "How can I insert data into Embedbase in Javascript? (code block)",
];

interface EmbedbaseSearchBarProps {
  value?: string;
  onChange?: (e: any) => void;
  autoFocus?: boolean;
  placeholder?: string;
  onClick?: () => void;
}

const EmbedbaseSearchBar = ({
  value,
  onChange,
  autoFocus,
  placeholder,
  onClick,
}: EmbedbaseSearchBarProps) => {
  return (
    // a magnifier icon on the left
    <input
      autoFocus={autoFocus || false}
      placeholder={placeholder || "Search..."}
      onClick={onClick}
      type="text"
      value={value}
      onChange={onChange}
      // border around with smooth corners, a magnifier icon on the left,
      // the search bar taking up the rest of the space
      // focused on load
      style={{
        width: "100%",
        padding: "0.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        outline: "none",
      }}
    />
  );
};

const SearchModal = () => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);

  const onClose = () => {
    setOpen(false);
    setPrompt("");
    setOutput("");
    setLoading(false);
  };

  const qa = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setOutput("");
    const promptResponse = await fetch("/api/buildPrompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });
    const promptData = await promptResponse.json();
    const response = await fetch("/api/qa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: promptData.prompt,
      }),
    });
    console.log("Edge function returned.");
    setLoading(false);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setOutput((prev) => prev + chunkValue);
    }

    setLoading(false);
  };
  // a nice looking input search bar with cmd k to open
  // on open, show a modal with a form to enter a prompt
  return (
    <div>
      {/* on click, open modal */}
      <EmbedbaseSearchBar
        onClick={() => setOpen(true)}
        placeholder="Ask a question..."
      />
      <Modal open={open} onClose={onClose}>
        <form onSubmit={qa} className="nx-flex nx-gap-3">
          <EmbedbaseSearchBar
            value={prompt}
            placeholder="Ask a question..."
            onChange={(e) => setPrompt(e.target.value)}
            autoFocus
          />
          <button style={{ marginLeft: "1rem" }} type="submit">
            Ask
          </button>
        </form>
        {/* row oriented, centered, with a gap of 3 */}
        <div className="nx-flex nx-gap-3 nx-py-4 nx-min-h-40 nx-flex-col">
          {!loading && output.length < 1 && (
            <div className="nx-text-gray-400	nx-text-sm nx-font-semibold">
              Your result will appear here
            </div>
          )}
          {loading && (
            <div className="nx-flex nx-items-center nx-justify-center">
              <span>Loading...</span>
              <div
                style={{
                  width: "1rem",
                  height: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "50%",
                  borderTopColor: "black",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
            </div>
          )}
          {!loading && output.length > 0 && (
            <ReactMarkdown components={MarkdownComponents}>
              {output}
            </ReactMarkdown>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: "1rem",
          }}
        >
          <div className="nx-mt-2">Try one of these samples:</div>
          <div
            style={{
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
            }}
            // examples as a list of bullets
            className="nx-flex-row"
          >
            <ul>
              {questions.map((q) => (
                // in row orientation, centered, with a gap of 3
                <li key={q} onClick={() => setPrompt(q)}>
                  - {q}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.5rem 0",
              fontSize: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.25rem",
              }}
            >
              <a href="https://embedbase.xyz" className="underline">
                Powered by Embedbase
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const config: DocsThemeConfig = {
  logo: (
    <img
      src={"/embedbase-long.svg"}
      alt="Embedbase Logo"
      className="max-h-[60px]"
    />
  ),
  head: function useHead() {
    const config = useConfig<{ description?: string; image?: string }>();
    const description =
      config.frontMatter.description ||
      "Embedbase is a suite of open-source tools to help developers use ML embeddings.";
    const image = config.frontMatter.image || "embedbasejs.png";
    return (
      <>
        {/* Favicons, meta */}

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />

        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta httpEquiv="Content-Language" content="en" />
        <meta name="description" content={description} />
        <meta name="og:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        {/* <meta name="twitter:site" content="@embedbase" /> */}
        <meta name="twitter:image" content={image} />
        <meta name="og:title" content={`${config.title} – embedbase`} />
        <meta name="og:image" content={image} />
        <meta name="apple-mobile-web-app-title" content="embedbase" />
      </>
    );
  },
  project: {
    link: "https://github.com/another-ai/embedbase",
  },
  chat: {
    link: "https://discord.gg/DYE6VFTJET",
  },
  docsRepositoryBase: "https://github.com/another-ai/embedbase-docs",
  footer: {
    text: "Embedbase Docs",
  },
  search: {
    component: <SearchModal />,
  },
};

export default config;
