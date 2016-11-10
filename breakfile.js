// sorry! just a copy paste from codepen at the moment

function invariant(exp, label) {if (!exp) throw new Error(label)}

function synchronousCreateViewModelFromUser(user) {
  const viewModel = {
    username: user.name
  }
  viewModel.subtitle = (user.id < 2000) ? 'lagacy' : 'listener'
  viewModel.canShowSecret = (user.name === 'steve') 
  if (viewModel.canShowSecret) {
   viewModel.secretData = {
    secret1: 'bob is on a diet of pills and booze'
   }
  } else {
   viewModel.spacefillingAd = {
     src: 'http://adflow.net/234234.xml'
   }
  }
  return viewModel
}

const user = {name: 'steve', id: 10765}

// BreakFileSystem
// some requirements:-
// 1) we must be able to look up a targt from a filename
//   only support very simple patterns of the form 'part.part.part' where part can be % to unify
// 2) we must be able to convert a requisite pattern into a concrete filename
// 

function indexesOfPattern(parts, pattern) {
  const foundIndexes = []
  for (let i=0; i< parts.length; i++) {
    if (parts[i] === pattern) foundIndexes.push(i)
  }
  return foundIndexes
}

function fSConcreteRequisiteName(requisitePattern, outputName, targetPattern) {
  if (requisitePattern.indexOf('%') === -1) return requisitePattern
  const requisitePatternParts = requisitePattern.split('.')
  const outputNameParts = outputName.split('.')
  const targetPatternParts = targetPattern.split('.')
  const replacePartsIndexesIterator = indexesOfPattern(targetPatternParts, '%')[Symbol.iterator]()
  
  const concreteName = []
  for(let i=0; i<requisitePatternParts.length; i++) {
    if (requisitePatternParts[i] === '%') {
      const concretePartIndex = replacePartsIndexesIterator.next().value
      const concretePart = outputNameParts[concretePartIndex]
      concreteName.push(concretePart)
    } else {
      concreteName.push(requisitePatternParts[i])
    }
  }  
  return concreteName.join('.')
}

function fSNameMatchPatternParts(name, pattern) {
  if (pattern === name || pattern === '%') return name
  return false
}

function fSNameMatchPattern(name, pattern) {
  const patternParts = pattern.split('.')
  const nameparts = name.split('.')
  if (nameparts.length !== patternParts.length) return false
  const successfullyMatchedParts = []
  for(let i=0; i<nameparts.length; i++) {   
    const match = fSNameMatchPatternParts(nameparts[i], patternParts[i])  
    if (match) {
      successfullyMatchedParts.push(match)
    } else { 
      return false
    }
  }
  return successfullyMatchedParts
}
const FS = {
  globalTimestamp: 1,
  globalData: {},
  targets: [],
  
  saveDataToFile: function(fname, data) {
    this.globalData[fname] = {
      timestamp: this.globalTimestamp++, 
      fname: fname, 
      data: data /* think about deep copy */
    }
  },
  // important this can return nil
  retreiveFile: function(fname) {
    const matchedTargetForFile = _.find(this.targets, (target) => (fSNameMatchPattern(fname, target.targetPattern)))    
    const existingFile = this.globalData[fname]
    const existingFileTimestamp = existingFile ? existingFile.timestamp : 0
    if (matchedTargetForFile) {
      this.buildTarget(fname, matchedTargetForFile, existingFileTimestamp)
    }
    return this.globalData[fname]
  },

  buildTarget: function(outputName, target, existingTimestamp=0) {
    let isDirty = (existingTimestamp === 0)
    const srcFileNames = []
    _.each(target.requisitePatterns, requisitePattern => { /* make sure this can be empty */
      const srcFilename = fSConcreteRequisiteName(requisitePattern, outputName, target.targetPattern)
      srcFileNames.push(srcFilename)
      const requisiteFile = this.retreiveFile(srcFilename)
      if (requisiteFile.timestamp > existingTimestamp) isDirty = true      
    })
    if (isDirty) target.rulef.call(this, outputName, srcFileNames)
  },

  addTarget: function(targetPattern, requisitePatterns, rulef) {
    this.targets.push({
      targetPattern,
      requisitePatterns, 
      rulef
    })
  }
}

// helpers
function fname_user(user) { return 'users.' + user.id }
function fname_userViewModel(user) { return fname_user(user) + '.viewmodel' }

function saveUserToFile(user) {
  FS.saveDataToFile(fname_user(user), user)
}

// example make rule - viewmodel depends on user data
FS.addTarget('users.%.viewmodel', ['users.%'], function(targetName, requisiteNames) {
  debugger
  const userFile = this.retreiveFile(requisiteNames[0])
  const viewModel = synchronousCreateViewModelFromUser(userFile.data)
  this.saveDataToFile(targetName, viewModel)
})

// tests
invariant(fSConcreteRequisiteName('bob') === 'bob', 'surely oh please')
invariant(fSConcreteRequisiteName('%', 'bob', '%') === 'bob', 'surely this too')
invariant(fSConcreteRequisiteName('%', 'bob.bobbins', 'bob.%') === 'bobbins', 'surely derp')
invariant(fSConcreteRequisiteName('%.%.%', 'big.bad.bob', '%.%.%') === 'big.bad.bob', 'surely berp')
invariant(fSConcreteRequisiteName('%.%.output', 'big.bad.bob', '%.%.%') === 'big.bad.output', 'surely')

invariant(!fSNameMatchPattern('bob', 'sandy'), 'oops come on this is easy')
invariant(fSNameMatchPattern('bob', 'bob'), 'oops this too?')
invariant(fSNameMatchPattern('bob', '%'), 'oops')
invariant(!fSNameMatchPattern('bob.job', '%'), 'oops my legs')
invariant(fSNameMatchPattern('bob.job', '%.%'), 'oops broken')
invariant(fSNameMatchPattern('bob.job', 'bob.%'), 'oops stab')
invariant(fSNameMatchPattern('bob.job', '%.job'), 'oops infinite')
invariant(fSNameMatchPattern('bob.job', 'bob.job'), 'oops oh dear')
invariant(fSNameMatchPattern('users.10999.viewmodel', 'users.%.viewmodel'), 'oops')

// the app
saveUserToFile(user)
const viewModelFile1 = FS.retreiveFile(fname_userViewModel(user))
const viewModelFile2 = FS.retreiveFile(fname_userViewModel(user))
