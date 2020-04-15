---
title: Setting up Apollo GraphQL in Next.js with Server Side Rendering.
published: true
description: Setting up Apollo GraphQL in Next.js with Server Side Rendering and boost search engine optimisation.
tags: react, graphql, nextjs, server side rendering
---

Single page applications are a popular way of architecting modern front end applications. However, the biggest downside to client side rendering is poor SEO (Search Engine Optimisation). In this article, we'll look at setting up a react app using the Next.js react framework and server render the initial pages with remote data from a GraphQL API.

# Prerequisites

- Node.js ≥ 12.16.2 (LTS)
- React
- Next.js
- GraphQL
- Apollo Client
- Yarn Package Manager

# Why SEO ?

Now you may be asking why SEO's important? Well... if you're building out a dashboard or an application that is **just** going to be used inside your intranet, Server rendering react and SEO may not be high in your product backlog. Moreover, if your organisation is in the e-commerce space, than SEO is a key player. SEO ensures your products listing or product pages get indexed and ranked high by Google and other search engine providers. This indirectly results in more views from potential buyers, which can greatly affect how much revenue your company generates online. 😉

# Application Setup

## Scaffolding a new Next.js app

Let's get started by creating a new folder and initialising a package.json with the default flags. I'm using yarn here, but it's also possible to install and run everything using npm.

```bash
mkdir react-graphql-ssr
yarn init -y
```

Sweet! Now that we have a new project initialised, it's time to add some dependencies. Lets install **next, react and react-dom** . Open up your favourite terminal and run the following command :

```bash
yarn add next react react-dom
```

Your package.json should now look like this :

```json
{
	"name": "react-graphql-ssr",
	"version": "1.0.0",
	"main": "index.js",
	"license": "MIT",
	"author": "Angad Gupta",
	"dependencies": {
		"next": "^9.3.5",
		"react": "^16.13.1",
		"react-dom": "^16.13.1"
	}
}
```

Let's add a few script to make the application run. **Good news** similar to create-react-app, Next.js abstracts away the web-pack config and by default provides 3 scripts to help you get started with development and focus on your product rather than the underlying web-pack configuration.

- dev script with hot code reload and goodies
- build script to package your your application for production
- start script to run your application in production.

```json
"scripts": {
  "dev": "next",
  "build": "next build",
  "start": "next start"
}
```

Your package.json should now look like this :

```json
{
	"name": "react-graphql-ssr",
	"version": "1.0.0",
	"main": "index.js",
	"license": "MIT",
	"author": "Angad Gupta",
	"scripts": {
		"dev": "next",
		"build": "next build",
		"start": "next start"
	},
	"dependencies": {
		"next": "^9.3.5",
		"react": "^16.13.1",
		"react-dom": "^16.13.1"
	}
}
```

Phew.... now that you have your application setup locally, let's create a pages directory and add a new page called index.js . _P.S you can extend this setup and make modification to web-pack, babel and also add Typescript if you like, however not required for the scope of this tutorial._

### Create pages directory

```bash
mkdir pages
cd pages
touch index.js
```

#### Create a React component

Add a new react component for index.js

```jsx
import React from 'react';

const IndexPage = () => {
	return (
		<>
			<h3>Setting up Apollo GraphQL in Next.js with Server Side Rendering</h3>
		</>
	);
};

export default IndexPage;
```

You should now be able to run the project using **yarn dev** from your terminal and view your the index page running on http://localhost:3000 with hot code reloading. The page will should show a heading "Setting up Apollo GraphQL in Next.js with Server Side Rendering"

## Add GraphQL

Add GraphQl dependencies to the project

```bash
yarn add graphql graphql-tag
```

## Add Apollo Client

Add Apollo client dependencies to the project

```bash
yarn add @apollo/react-hooks @apollo/react-ssr apollo-cache-inmemory apollo-client apollo-link-http isomorphic-unfetch prop-types
```

## Setup Apollo Client

To get Apollo client to work well, in the root project folder, create a libs folder and add an apollo.js file.

```bash
mkdir libs
cd libs
touch apollo.js
```

Add the following code to the apollo.js file :

```javascript
import React from 'react';
import App from 'next/app';
import Head from 'next/head';
import { ApolloProvider } from '@apollo/react-hooks';
import createApolloClient from '../apolloClient';

// On the client, we store the Apollo Client in the following variable.
// This prevents the client from reinitializing between page transitions.
let globalApolloClient = null;

/**
 * Installs the Apollo Client on NextPageContext
 * or NextAppContext. Useful if you want to use apolloClient
 * inside getStaticProps, getStaticPaths or getServerSideProps
 * @param {NextPageContext | NextAppContext} ctx
 */
export const initOnContext = (ctx) => {
	const inAppContext = Boolean(ctx.ctx);

	// We consider installing `withApollo({ ssr: true })` on global App level
	// as antipattern since it disables project wide Automatic Static Optimization.
	if (process.env.NODE_ENV === 'development') {
		if (inAppContext) {
			console.warn(
				'Warning: You have opted-out of Automatic Static Optimization due to `withApollo` in `pages/_app`.\n' +
					'Read more: https://err.sh/next.js/opt-out-auto-static-optimization\n'
			);
		}
	}

	// Initialize ApolloClient if not already done
	const apolloClient =
		ctx.apolloClient ||
		initApolloClient(ctx.apolloState || {}, inAppContext ? ctx.ctx : ctx);

	// We send the Apollo Client as a prop to the component to avoid calling initApollo() twice in the server.
	// Otherwise, the component would have to call initApollo() again but this
	// time without the context. Once that happens, the following code will make sure we send
	// the prop as `null` to the browser.
	apolloClient.toJSON = () => null;

	// Add apolloClient to NextPageContext & NextAppContext.
	// This allows us to consume the apolloClient inside our
	// custom `getInitialProps({ apolloClient })`.
	ctx.apolloClient = apolloClient;
	if (inAppContext) {
		ctx.ctx.apolloClient = apolloClient;
	}

	return ctx;
};

/**
 * Always creates a new apollo client on the server
 * Creates or reuses apollo client in the browser.
 * @param  {NormalizedCacheObject} initialState
 * @param  {NextPageContext} ctx
 */
const initApolloClient = (initialState, ctx) => {
	// Make sure to create a new client for every server-side request so that data
	// isn't shared between connections (which would be bad)
	if (typeof window === 'undefined') {
		return createApolloClient(initialState, ctx);
	}

	// Reuse client on the client-side
	if (!globalApolloClient) {
		globalApolloClient = createApolloClient(initialState, ctx);
	}

	return globalApolloClient;
};

/**
 * Creates a withApollo HOC
 * that provides the apolloContext
 * to a next.js Page or AppTree.
 * @param  {Object} withApolloOptions
 * @param  {Boolean} [withApolloOptions.ssr=false]
 * @returns {(PageComponent: ReactNode) => ReactNode}
 */
export const withApollo = ({ ssr = false } = {}) => (PageComponent) => {
	const WithApollo = ({ apolloClient, apolloState, ...pageProps }) => {
		let client;
		if (apolloClient) {
			// Happens on: getDataFromTree & next.js ssr
			client = apolloClient;
		} else {
			// Happens on: next.js csr
			client = initApolloClient(apolloState, undefined);
		}

		return (
			<ApolloProvider client={client}>
				<PageComponent {...pageProps} />
			</ApolloProvider>
		);
	};

	// Set the correct displayName in development
	if (process.env.NODE_ENV !== 'production') {
		const displayName =
			PageComponent.displayName || PageComponent.name || 'Component';
		WithApollo.displayName = `withApollo(${displayName})`;
	}

	if (ssr || PageComponent.getInitialProps) {
		WithApollo.getInitialProps = async (ctx) => {
			const inAppContext = Boolean(ctx.ctx);
			const { apolloClient } = initOnContext(ctx);

			// Run wrapped getInitialProps methods
			let pageProps = {};
			if (PageComponent.getInitialProps) {
				pageProps = await PageComponent.getInitialProps(ctx);
			} else if (inAppContext) {
				pageProps = await App.getInitialProps(ctx);
			}

			// Only on the server:
			if (typeof window === 'undefined') {
				const { AppTree } = ctx;
				// When redirecting, the response is finished.
				// No point in continuing to render
				if (ctx.res && ctx.res.finished) {
					return pageProps;
				}

				// Only if dataFromTree is enabled
				if (ssr && AppTree) {
					try {
						// Import `@apollo/react-ssr` dynamically.
						// We don't want to have this in our client bundle.
						const { getDataFromTree } = await import('@apollo/react-ssr');

						// Since AppComponents and PageComponents have different context types
						// we need to modify their props a little.
						let props;
						if (inAppContext) {
							props = { ...pageProps, apolloClient };
						} else {
							props = { pageProps: { ...pageProps, apolloClient } };
						}

						// Take the Next.js AppTree, determine which queries are needed to render,
						// and fetch them. This method can be pretty slow since it renders
						// your entire AppTree once for every query. Check out apollo fragments
						// if you want to reduce the number of rerenders.
						// https://www.apollographql.com/docs/react/data/fragments/
						await getDataFromTree(<AppTree {...props} />);
					} catch (error) {
						// Prevent Apollo Client GraphQL errors from crashing SSR.
						// Handle them in components via the data.error prop:
						// https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
						console.error('Error while running `getDataFromTree`', error);
					}

					// getDataFromTree does not call componentWillUnmount
					// head side effect therefore need to be cleared manually
					Head.rewind();
				}
			}

			return {
				...pageProps,
				// Extract query data from the Apollo store
				apolloState: apolloClient.cache.extract(),
				// Provide the client for ssr. As soon as this payload
				// gets JSON.stringified it will remove itself.
				apolloClient: ctx.apolloClient,
			};
		};
	}

	return WithApollo;
};
```

Great! We're almost there, now let's initialise an Apollo client that will link to a GraphQL Server or Gateway. In the root folder, create a new file called apolloClient.js

```bash
touch apolloClient.js
```

Add add the following code to apolloClient.js file :

```javascript
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import fetch from 'isomorphic-unfetch';

export default function createApolloClient(initialState, ctx) {
	// The `ctx` (NextPageContext) will only be present on the server.
	// use it to extract auth headers (ctx.req) or similar.
	return new ApolloClient({
		ssrMode: Boolean(ctx),
		link: new HttpLink({
			uri: 'https://rickandmortyapi.com/graphql', // Server URL (must be absolute)
			credentials: 'same-origin', // Additional fetch() options like `credentials` or `headers`
			fetch,
		}),
		cache: new InMemoryCache().restore(initialState),
	});
}
```

For the purposes of this tutorial, we'll be consuming a free to use Rick and Morty GraphQL API which returns all the characters and their details.

## Write a query to fetch all characters from the Rick and Morty GraphQL API

Create a folder called gql and create a new file called allCharacters.js.
Add the following query to the allCharacters.js file.

```bash
mkdir gql
cd gql
touch allCharacters.js
```

```jsx
import gql from 'graphql-tag';

export const ALL_CHARACTERS = gql`
	query allCharacters {
		characters {
			results {
				id
				name
			}
		}
	}
`;
```

The file imports gql from a node module we previously installed called graphql-tag. The gql template literal tag can be used to concisely write a GraphQL query that is parsed into a standard GraphQL AST. It is the recommended method for passing queries to the Apollo Client.

## Call the GraphQL API using our index page

Lets add a few more imports to our index page.

```jsx
import { withApollo } from '../libs/apollo';
import { useQuery } from '@apollo/react-hooks';
import { ALL_CHARACTERS } from '../gql/allCharacters';
```

We're importing our apollo setup from the libs folder we just setup.

Using the useQuery hook from the apollo react-hooks library and parsing in our custom query we wrote in allCharacters.js file

```jsx
import React from 'react';
import { withApollo } from '../libs/apollo';
import { useQuery } from '@apollo/react-hooks';
import { ALL_CHARACTERS } from '../gql/allCharacters';

const IndexPage = () => {
	const { loading, error, data } = useQuery(ALL_CHARACTERS);
	if (error) return <h1>Error</h1>;
	if (loading) return <h1>Loading...</h1>;

	return (
		<>
			<h1>
				<h3>Setting up Apollo GraphQL in Next.js with Server Side Rendering</h3>
			</h1>
			<div>
				{data.characters.results.map((data) => (
					<ul key={data.id}>
						<li>{data.name}</li>
					</ul>
				))}
			</div>
		</>
	);
};

export default withApollo({ ssr: true })(IndexPage);
```

The Apollo useQuery hook receives 3 objects. loading, error and data which manages the API call and sets State on data if there were no errors.

Once the data is returned without any errors, we can map over the data using the the native javascript map function and create an unordered list with Character names as the list items.

```jsx
{
	data.characters.results.map((data) => (
		<ul key={data.id}>
			<li>{data.name}</li>
		</ul>
	));
}
```

We're now exporting the IndexPage with ssr set as true, this under the hood server renders the page and sends the final rendered version to client with remote data.

## Testing the page contents

Let's test if the page contents are available when we view the page source. Right click on the index page in chrome and click on View Page Source. The characters details should be part of pages markup.

You can alternative also set the ssr flag to false when exporting the page and test. Moreover, depending on your internet speed, you will see the Loading... and the finally fetched remote data.

When inspecting and viewing source with ssr flag set to false, you'll notice the character data being returned is no longer part of our markup as its now client rendered.

# Benefits

You can choose to client render or server side render on a per page basis based on your business requirements. For constantly changing data e.g. dashboards, client side rendering is preferable, however for marketing pages that don't change frequently and don't have remote - data blocking requirements, pre-rendering or static generated pages can be published ahead of time and cached on a global CDN like Cloud-front by AWS.

# Going to production

Before you can take a setup such as this to production, ensure to optimise your page seo using next/head package, which exposes html elements such as title and head. Work with your team and add meaningful information thats relavant to your business.

# Extending this..

Feel free to extend this tutorial by adding more functionality, add your favourite UI styling library or play around with nested queries or GraphQL arguments. You can clone and fork this repository via GitHub.
