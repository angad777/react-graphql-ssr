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
