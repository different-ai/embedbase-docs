---
title: Using Embedbase to build ChatGPT-powered Q&A for your website
description: Embedbase helps you deploy embeddings-powered applications to the cloud.
---

 You can also try this tutorial in [Javascript](/docs/qa-chat-js).

Embedbase helps you deploy embeddings-powered applications to the cloud.

This tutorial builds on top of the following [OpenAI tutorial](https://platform.openai.com/docs/tutorials/web-qa-embeddings).

Below you'll find how you can change just a few lines of code and take the OpenAI tutorial from
localhost to prod.

You can try the full process by [downloading the source code](https://github.com/another-ai/embedbase-cookbook/blob/main/apps/web-crawl-q-and-a).

## Inserting data into Embedbase

Instead of storing embeddings locally, we send a simple request to the Embedbase API:

```python
import requests

VAULT_ID = "dev";
URL = "https://embedbase-hosted-usx5gpslaq-uc.a.run.app";
# find your Embedbase API key
API_KEY = "<https://app.embedbase.xyz/dashboard>";

async def embed(texts):
	requests.post(
		URL + "/v1/" + VAULT_ID,
		headers = {
			"Authorization": "Bearer " + API_KEY,
			"Content-Type": "application/json"
		},
		json = {
			# documents is like [{"data": "hello world"}, {"data": "hello world"}]
			"documents": texts,
		}
	)

# create batches of text from the dataframe
batches = []
for i in range(0, len(df), 100):
	batches.append(df.iloc[i:i+100].text.apply(lambda x: {"data": x}).tolist())
import asyncio
# run batches in parallel
await asyncio.gather(*[embed(batch) for batch in batches])
```

This should take about 15-30 seconds, after that, the embeddings are properly stored in Embedbase.

## Building a question answer system with your embeddings

Here, we don't need to embed and search locally, Embedbase take care of it:

```python
import openai
openai.api_key = "<https://platform.openai.com/account/api-keys>"

def search(query, vault_id):
	return requests.post(
		URL + "/v1/" + vault_id + "/search",
		headers = {
			"Authorization": "Bearer " + API_KEY,
			"Content-Type": "application/json"
		},
		json = {
			"query": query
		}
	)

def create_context(
    question, max_len=1800
):
    """
    Create a context for a question by finding the most similar context from the dataframe
    """
    search_response = search(question, VAULT_ID).json()
    cur_len = 0
    returns = []
    # Add the text to the context until the context is too long
    for similarity in search_response["similarities"]:
        sentence = similarity["data"]

        # Add the length of the text to the current length
        n_tokens = len(tokenizer.encode(sentence))
        cur_len += n_tokens + 4

        # If the context is too long, break
        if cur_len > max_len:
            break

        # Else add it to the text that is being returned
        returns.append(sentence)

    # Return the context
    return "\\n\\n###\\n\\n".join(returns)
```

The following is not very different from the original tutorial:

```python
def answer_question(
	model="text-davinci-003",
	question="Am I allowed to publish model outputs to Twitter, without a human review?",
	max_len=1800,
	debug=False,
	max_tokens=150,
	stop_sequence=None
):
	"""
	Answer a question based on the most similar context from the dataframe texts
	"""
	context = create_context(
		question,
		max_len=max_len,
	)

	# If debug, print the raw model response
	if debug:
		print("Context:\\n" + context)
		print("\\n\\n")

	try:
		# Create a completions using the question and context
		response = openai.Completion.create(
			prompt=f"Answer the question based on the context below, and if the question can't be answered based on the context, say \\"I don't know\\"\\n\\nContext: {context}\\n\\n---\\n\\nQuestion: {question}\\nAnswer:",
			temperature=0,
			max_tokens=max_tokens,
			top_p=1,
			frequency_penalty=0,
			presence_penalty=0,
			stop=stop_sequence,
			model=model,
		)
		return response["choices"][0]["text"].strip()
	except Exception as e:
		print(e)
		return ""
```

Now let's see if it works:

```python
answer_question(question="What day is it?", debug=False)

answer_question(question="What is our newest embeddings model?")

answer_question(question="What is ChatGPT?")
```

```python
"I don't know."

'The newest embeddings model is text-embedding-ada-002.'

'ChatGPT is a model trained to interact in a conversational way. It is able to answer followup questions, admit its mistakes, challenge incorrect premises, and reject inappropriate requests.'
```


## What can you do with this?

For example, you can generate a ChatGPT-like interface for your documentation by instead crawling/ingesting your documentation in Embedbase.

You could also use a Git repository as an external knowledge to let your users ask questions about a project and eventually generate the documentation.
