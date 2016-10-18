const GraphQL = require('graphql');
const resolver = require('./resolver');

module.exports = {
  generate: generate,
};

function generate(name, types, relayEnabled) {
	const allSubscriptions = types.objectTypes.Subscription || {};
	if(!(allSubscriptions && allSubscriptions._typeConfig && allSubscriptions._typeConfig.fields)) return;

  	const allSubscriptionFields = Object.keys(allSubscriptions._typeConfig.fields).map(x => allSubscriptions._typeConfig.fields[x]) || [];
	
	allSubscriptionFields.forEach(fieldValue => {
		// console.log(fieldValue)
		fieldValue.resolve =  function(parent, args, ctx, info) {
			return resolver.resolveSubscription(parent, args, ctx, info, fieldValue.type.name);
		};
	});
}
